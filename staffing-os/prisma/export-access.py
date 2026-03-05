# -*- coding: utf-8 -*-
"""
Export Access DB → JSON + Photos
Reads T_履歴書 from Microsoft Access and exports:
  - candidates.json (all candidate data mapped to Staffing OS schema)
  - photos/{id}.jpg (extracted from OLE binary)
"""
import pyodbc
import json
import os
import sys
import struct
import io
import base64
from datetime import datetime, date

sys.stdout.reconfigure(encoding='utf-8')

# ─── Config ──────────────────────────────────────────────────────────────
DB_PATH = r'C:\Users\kenji\OneDrive\Desktop\ユニバーサル企画㈱データベースv25.3.24.accdb'
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'legacy-import')
PHOTOS_DIR = os.path.join(OUTPUT_DIR, 'photos')

# ─── OLE Image Extraction (from RirekishoDBaseAntigua) ───────────────────

IMAGE_SIGNATURES = [
    (b'\xff\xd8\xff', '.jpg', 'JPEG'),
    (b'\x89PNG\r\n\x1a\n', '.png', 'PNG'),
    (b'BM', '.bmp', 'BMP'),
    (b'GIF8', '.gif', 'GIF'),
    (b'II\x2a\x00', '.tiff', 'TIFF_LE'),
    (b'MM\x00\x2a', '.tiff', 'TIFF_BE'),
]
DIB_HEADER_SIZE = b'\x28\x00\x00\x00'

try:
    from PIL import Image as PILImage
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def convert_dib_to_bmp(dib_data):
    if len(dib_data) < 40:
        return None
    try:
        bi_size = struct.unpack_from('<I', dib_data, 0)[0]
        if bi_size < 40:
            return None
        bi_bit_count = struct.unpack_from('<H', dib_data, 14)[0]
        if bi_bit_count <= 8:
            bi_clr_used = struct.unpack_from('<I', dib_data, 32)[0]
            color_table_size = (bi_clr_used if bi_clr_used else (1 << bi_bit_count)) * 4
        else:
            color_table_size = 0
        pixel_data_offset = 14 + bi_size + color_table_size
        file_size = 14 + len(dib_data)
        bmp_header = struct.pack('<2sIHHI', b'BM', file_size, 0, 0, pixel_data_offset)
        return bmp_header + dib_data
    except Exception:
        return None


def parse_ole_structure(raw):
    if len(raw) < 20:
        return None
    for pkg_skip in [0, 4, 6, 8, 12, 20]:
        try:
            test_offset = pkg_skip
            if test_offset + 4 > len(raw):
                continue
            ole_hdr_size = struct.unpack_from('<I', raw, test_offset)[0]
            if ole_hdr_size <= 0 or ole_hdr_size > len(raw):
                continue
            data_offset = test_offset + 4 + ole_hdr_size + 8
            if data_offset + 4 > len(raw):
                continue
            data_len = struct.unpack_from('<I', raw, data_offset)[0]
            if data_len <= 0 or data_len > len(raw):
                continue
            data_start = data_offset + 4
            if data_start + data_len > len(raw):
                continue
            data_block = raw[data_start:data_start + data_len]
            for sig, ext, fmt_name in IMAGE_SIGNATURES:
                if data_block.startswith(sig):
                    return data_block, ext, f"ole_parse@{data_start}"
            if data_block[:4] == DIB_HEADER_SIZE and len(data_block) > 40:
                bmp = convert_dib_to_bmp(data_block)
                if bmp:
                    return bmp, ".bmp", f"ole_parse_dib@{data_start}"
        except Exception:
            continue
    return None


def extract_image_from_ole(ole_data):
    if ole_data is None or len(ole_data) == 0:
        return None, None
    if isinstance(ole_data, bytes):
        raw = ole_data
    elif isinstance(ole_data, bytearray):
        raw = bytes(ole_data)
    elif isinstance(ole_data, str):
        raw = ole_data.encode('latin-1', errors='replace')
    else:
        raw = bytes(ole_data)

    # Strategy 1: Known image signatures
    best_match = None
    best_offset = len(raw)
    for signature, ext, fmt_name in IMAGE_SIGNATURES:
        offset = raw.find(signature)
        if offset != -1 and offset < best_offset:
            best_offset = offset
            best_match = (raw[offset:], ext)
    if best_match:
        img_bytes, ext = best_match
        if len(img_bytes) > 10:
            if ext == ".jpg":
                end_marker = img_bytes.rfind(b"\xff\xd9")
                if end_marker != -1:
                    img_bytes = img_bytes[:end_marker + 2]
                return img_bytes, ext
            if ext == ".png":
                iend = img_bytes.find(b"IEND")
                if iend != -1:
                    img_bytes = img_bytes[:iend + 8]
                return img_bytes, ext
            return img_bytes, ext

    # Strategy 2: DIB
    dib_offset = raw.find(DIB_HEADER_SIZE)
    if dib_offset != -1 and dib_offset < len(raw) - 40:
        bmp_data = convert_dib_to_bmp(raw[dib_offset:])
        if bmp_data:
            return bmp_data, ".bmp"

    # Strategy 3: Parse OLE structure
    try:
        result = parse_ole_structure(raw)
        if result:
            return result[0], result[1]
    except Exception:
        pass

    # Strategy 4: OLE compound
    ole_compound_sig = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"
    compound_offset = raw.find(ole_compound_sig)
    if compound_offset != -1:
        try:
            import olefile
            ole_stream = io.BytesIO(raw[compound_offset:])
            if olefile.isOleFile(ole_stream):
                ole = olefile.OleFileIO(ole_stream)
                for stream_name in ole.listdir():
                    stream_path = "/".join(stream_name)
                    if "contents" in stream_path.lower() or "package" in stream_path.lower():
                        stream_data = ole.openstream(stream_name).read()
                        sub_result = extract_image_from_ole(stream_data)
                        if sub_result[0]:
                            ole.close()
                            return sub_result
                ole.close()
        except Exception:
            pass

    return None, None


def image_to_base64_jpg(img_bytes, ext):
    """Convert image bytes to base64 JPEG data URL."""
    if not HAS_PIL:
        mime = 'image/jpeg' if ext == '.jpg' else 'image/png'
        return f"data:{mime};base64,{base64.b64encode(img_bytes).decode()}"
    try:
        img = PILImage.open(io.BytesIO(img_bytes))
        if img.mode in ('RGBA', 'P', 'LA'):
            img = img.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=85)
        b64 = base64.b64encode(buf.getvalue()).decode()
        return f"data:image/jpeg;base64,{b64}"
    except Exception:
        return f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode()}"


# ─── Field Mapping Helpers ───────────────────────────────────────────────

PREFECTURES = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
    "岐阜県", "静岡県", "愛知県", "三重県",
    "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
    "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県",
    "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
]

VISA_MAP = {
    "永住者": "PERMANENT_RESIDENT",
    "日本人の配偶者等": "SPOUSE_OF_JAPANESE",
    "定住者": "LONG_TERM_RESIDENT",
    "特定活動": "DESIGNATED_ACTIVITIES",
    "技術・人文知識・国際業務": "ENGINEER_HUMANITIES",
    "技術": "ENGINEER_HUMANITIES",
    "人文知識": "ENGINEER_HUMANITIES",
    "文化活動": "CULTURAL_ACTIVITIES",
    "高度専門職1号": "HIGHLY_SKILLED_1",
    "高度専門職2号": "HIGHLY_SKILLED_2",
    "企業内転勤": "INTRA_COMPANY_TRANSFER",
    "介護": "NURSING_CARE",
    "技能実習1号": "TECHNICAL_INTERN_1",
    "技能実習2号": "TECHNICAL_INTERN_2",
    "技能実習3号": "TECHNICAL_INTERN_3",
    "特定技能1号": "SPECIFIED_SKILLED_1",
    "特定技能2号": "SPECIFIED_SKILLED_2",
    "留学": "STUDENT",
    "家族滞在": "DEPENDENT",
}

# Half-width katakana → full-width
HW_KANA_MAP = str.maketrans(
    'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ',
    'ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン゛゜'
)

DAKUTEN_MAP = {
    'カ゛': 'ガ', 'キ゛': 'ギ', 'ク゛': 'グ', 'ケ゛': 'ゲ', 'コ゛': 'ゴ',
    'サ゛': 'ザ', 'シ゛': 'ジ', 'ス゛': 'ズ', 'セ゛': 'ゼ', 'ソ゛': 'ゾ',
    'タ゛': 'ダ', 'チ゛': 'ヂ', 'ツ゛': 'ヅ', 'テ゛': 'デ', 'ト゛': 'ド',
    'ハ゛': 'バ', 'ヒ゛': 'ビ', 'フ゛': 'ブ', 'ヘ゛': 'ベ', 'ホ゛': 'ボ',
    'ウ゛': 'ヴ',
    'ハ゜': 'パ', 'ヒ゜': 'ピ', 'フ゜': 'プ', 'ヘ゜': 'ペ', 'ホ゜': 'ポ',
}


def to_fullwidth_kana(text):
    if not text:
        return text
    result = text.translate(HW_KANA_MAP)
    for hw, fw in DAKUTEN_MAP.items():
        result = result.replace(hw, fw)
    return result


def split_name(full_name):
    """Split full name into (lastName, firstName). For foreign names: first token = last."""
    if not full_name or not full_name.strip():
        return ("", "")
    parts = full_name.strip().split()
    if len(parts) == 1:
        return (parts[0], "")
    return (parts[0], " ".join(parts[1:]))


def extract_prefecture(address):
    """Extract prefecture from Japanese address string."""
    if not address:
        return (None, address)
    for pref in PREFECTURES:
        if address.startswith(pref):
            return (pref, address[len(pref):])
    return (None, address)


def format_postal(code):
    """Format postal code as XXX-XXXX."""
    if not code:
        return None
    code = str(code).strip().replace('-', '').replace('ー', '').replace('−', '')
    if len(code) == 7 and code.isdigit():
        return f"{code[:3]}-{code[3:]}"
    return code if code else None


def clean_measure(val):
    """Remove cm/kg suffixes from measurements."""
    if not val:
        return None
    return str(val).strip().replace('cm', '').replace('kg', '').replace('ｃｍ', '').replace('ｋｇ', '').strip() or None


def map_gender(val):
    if not val:
        return None
    if '男' in str(val):
        return 'MALE'
    if '女' in str(val):
        return 'FEMALE'
    return None


def map_visa(val):
    if not val:
        return None
    val_str = to_fullwidth_kana(str(val).strip())
    if val_str in VISA_MAP:
        return VISA_MAP[val_str]
    for key, enum_val in VISA_MAP.items():
        if key in val_str or val_str in key:
            return enum_val
    return "OTHER"


def to_date_str(val):
    """Convert datetime to ISO date string."""
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val.strftime('%Y-%m-%d')
    return str(val).strip() or None


def map_bento(row):
    if row.get('お弁当　昼/夜'):
        return '昼/夜'
    if row.get('お弁当　昼のみ'):
        return '昼のみ'
    if row.get('お弁当　夜のみ'):
        return '夜のみ'
    if row.get('お弁当　持参'):
        return '持参'
    return None


def map_jlpt(row):
    level = row.get('日本語能力資格Level', '') or ''
    if 'N1' in level or 'Ｎ１' in level:
        return 'N1'
    if 'N2' in level or 'Ｎ２' in level:
        return 'N2'
    if 'N3' in level or 'Ｎ３' in level:
        return 'N3'
    if 'N4' in level or 'Ｎ４' in level:
        return 'N4'
    if 'N5' in level or 'Ｎ５' in level:
        return 'N5'
    return 'NONE'


def extract_family_members(row):
    members = []
    for i in range(1, 6):
        name = row.get(f'家族構成氏名{i}')
        if not name or not str(name).strip():
            continue
        rel = row.get(f'家族構成続柄{i}', '') or ''
        age = row.get(f'年齢{i}', '') or ''
        residence = row.get(f'居住{i}', '') or ''
        address = row.get(f'別居住住所{i}', '') or ''
        live_together = '同居' in str(residence)
        members.append({
            'name': str(name).strip(),
            'relationship': str(rel).strip(),
            'age': str(age).strip().replace('歳', '') or None,
            'liveTogether': live_together,
            'residence': str(residence).strip() or None,
            'dependent': None,
            'sortOrder': i,
        })
    return members


def extract_work_history(row):
    entries = []
    sort = 0
    for i in range(1, 8):
        company_in = row.get(f'職歴入社会社名{i}', '') or ''
        company_out = row.get(f'職歴退社会社名{i}', '') or ''
        start_y = row.get(f'職歴年入社{i}', '') or ''
        start_m = row.get(f'職歴月入社{i}', '') or ''
        end_y = row.get(f'職歴年退社社{i}', '') or ''
        end_m = row.get(f'職歴月退社社{i}', '') or ''

        if not str(company_in).strip() and not str(company_out).strip():
            continue

        company_str = str(company_in).strip()
        hakenmoto = None
        hakensaki = None
        company_name = company_str

        # Detect 派遣元/派遣先 pattern
        if '派遣元' in company_str:
            hakenmoto = company_str.replace('派遣元：', '').replace('派遣元:', '').strip()
            company_name = hakenmoto
            # Check if next entry is 派遣先
            next_company = row.get(f'職歴入社会社名{i+1 if i < 7 else i}', '') or ''
            if '派遣先' in str(next_company):
                hakensaki = str(next_company).replace('派遣先：', '').replace('派遣先:', '').strip()
        elif '派遣先' in company_str:
            # Already handled as part of previous entry
            continue

        def parse_year(y):
            s = str(y).strip().replace('年', '')
            try:
                return int(s)
            except ValueError:
                return None

        def parse_month(m):
            s = str(m).strip().replace('月', '')
            try:
                return int(s)
            except ValueError:
                return None

        sort += 1
        entries.append({
            'startYear': parse_year(start_y),
            'startMonth': parse_month(start_m),
            'endYear': parse_year(end_y),
            'endMonth': parse_month(end_m),
            'companyName': company_name,
            'position': None,
            'jobContent': None,
            'eventType': '入社',
            'hakenmoto': hakenmoto,
            'hakensaki': hakensaki,
            'workLocation': None,
            'sortOrder': sort,
        })
    return entries


def map_candidate(row, photo_b64):
    """Map an Access DB row to Staffing OS Candidate schema."""
    name = str(row.get('氏名', '') or '').strip()
    furigana = str(row.get('フリガナ', '') or '').strip()
    romaji = str(row.get('氏名（ローマ字)', '') or '').strip()

    last_name_r, first_name_r = split_name(name)
    last_furi, first_furi = split_name(furigana)

    # If 氏名 is in romaji (Latin chars), use it for romaji fields
    is_romaji = all(ord(c) < 256 or c == ' ' for c in name) if name else False

    address = str(row.get('現住所', '') or '').strip()
    prefecture, city = extract_prefecture(address)

    # Map allergy
    allergy_name = row.get('アレルギー 名', '') or ''
    has_allergy = row.get('アレルギー有無', '') or ''
    allergies = str(allergy_name).strip() if '有' in str(has_allergy) else None

    # Dominant hand
    hand = row.get('利き腕', '') or ''
    dominant_hand = None
    if '右' in str(hand):
        dominant_hand = '右'
    elif '左' in str(hand):
        dominant_hand = '左'

    candidate = {
        # Names
        'lastNameKanji': last_name_r if not is_romaji else (last_furi or last_name_r),
        'firstNameKanji': first_name_r if not is_romaji else (first_furi or first_name_r),
        'lastNameFurigana': to_fullwidth_kana(last_furi) or None,
        'firstNameFurigana': to_fullwidth_kana(first_furi) or None,
        'lastNameRomaji': last_name_r if is_romaji else None,
        'firstNameRomaji': first_name_r if is_romaji else None,

        # Personal
        'birthDate': to_date_str(row.get('生年月日')),
        'gender': map_gender(row.get('性別')),
        'nationality': to_fullwidth_kana(str(row.get('国籍', '') or '').strip()) or None,
        'bloodType': str(row.get('血液型', '') or '').strip().replace('型', '') or None,
        'height': clean_measure(row.get('身長')),
        'weight': clean_measure(row.get('体重')),
        'shoeSize': clean_measure(row.get('靴サイズ')),
        'dominantHand': dominant_hand,

        # Contact
        'postalCode': format_postal(row.get('郵便番号')),
        'prefecture': prefecture,
        'city': city or None,
        'addressLine1': str(row.get('番地', '') or '').strip() or None,
        'addressLine2': str(row.get('物件名', '') or '').strip() or None,
        'phone': str(row.get('電話番号', '') or '').strip() or None,
        'mobile': str(row.get('携帯電話', '') or '').strip() or None,

        # Immigration
        'passportNumber': str(row.get('パスポート番号', '') or '').strip() or None,
        'passportExpiry': to_date_str(row.get('パスポート期限')),
        'residenceCardNumber': str(row.get('在留カード番号', '') or '').strip() or None,
        'residenceCardExpiry': to_date_str(row.get('（在留カード記載）在留期限')),
        'visaStatus': map_visa(row.get('在留資格')),
        'visaExpiry': to_date_str(row.get('（在留カード記載）在留期限')),

        # Photo
        'photoDataUrl': photo_b64,

        # Experience booleans
        'expWelding': bool(row.get('溶接')),
        'expForklift': bool(row.get('ﾌｫｰｸﾘﾌﾄ')),
        'expLineWork': bool(row.get('車部品ライン')),
        'expAssembly': bool(row.get('車部品組立')),
        'expPacking': bool(row.get('梱包')),
        'expInspection': bool(row.get('車部品検査') or row.get('電子部品検査')),
        'expPainting': bool(row.get('塗装')),
        'expMachining': bool(row.get('旋盤') or row.get('NC旋盤')),
        'expCleaning': False,
        'expCooking': bool(row.get('食品加工')),
        'expLineLeader': bool(row.get('ラインリーダー')),
        'expOther': '鋳造' if row.get('鋳造') else ('プレス' if row.get('ﾌﾟﾚｽ') else None),

        # Licenses
        'hasDriverLicense': bool(row.get('運転免許番号及び条件')),
        'driverLicenseType': str(row.get('運転免許番号及び条件', '') or '').strip() or None,
        'hasForkliftLicense': bool(row.get('ﾌｫｰｸﾘﾌﾄ免許')),
        'hasCraneLicense': bool(row.get('移動式ｸﾚｰﾝ運転士(5ﾄﾝ未満)') or row.get('移動式ｸﾚｰﾝ運転士(5ﾄﾝ以上)')),
        'hasWeldingCert': bool(row.get('ｶﾞｽ溶接作業者')),
        'hasTamakake': bool(row.get('玉掛')),

        # Language
        'jlptLevel': map_jlpt(row),
        'speakLevel': str(row.get('話す選択', '') or '').strip() or str(row.get('会話ができる', '') or '').strip() or None,
        'listenLevel': str(row.get('聞く選択', '') or '').strip() or str(row.get('会話が理解できる', '') or '').strip() or None,
        'kanjiReadLevel': str(row.get('読む　漢字', '') or '').strip() or None,
        'kanjiWriteLevel': str(row.get('書く　漢字', '') or '').strip() or None,
        'hiraganaReadLevel': str(row.get('読む　ひら', '') or '').strip() or None,
        'hiraganaWriteLevel': str(row.get('書く　ひら', '') or '').strip() or None,
        'katakanaReadLevel': str(row.get('読む　カナ', '') or '').strip() or None,
        'katakanaWriteLevel': str(row.get('書く　カナ', '') or '').strip() or None,

        # Preferences
        'bentoPreference': map_bento(row),
        'lunchPref': map_bento(row),
        'allergies': allergies,

        # Personal — new fields
        'spouse': '有' if row.get('配偶者') and '有' in str(row.get('配偶者')) else ('無' if row.get('配偶者') else None),

        # Interview / Medical
        'interviewResult': 'OK' if row.get('面接結果OK') else None,
        'covidVaccineStatus': str(row.get('コロナワクチン予防接種状態', '') or '').strip() or None,
        'antigenTestResult': str(row.get('簡易抗原検査キット', '') or '').strip() or None,
        'antigenTestDate': to_date_str(row.get('簡易抗原検査実施日')),

        # Emergency contact
        'emergencyContactName': str(row.get('緊急連絡先　氏名', '') or '').strip() or None,
        'emergencyContactPhone': str(row.get('緊急連絡先　電話番号', '') or '').strip() or None,
        'emergencyContactRelation': str(row.get('緊急連絡先　続柄', '') or '').strip() or None,

        # Rirekisho-specific
        'receptionDate': to_date_str(row.get('受付日')),
        'timeInJapan': str(row.get('来日', '') or '').strip() or None,
        'uniformSize': str(row.get('服のサイズ', '') or '').strip() or None,
        'waist': clean_measure(row.get('ウエスト')),
        'safetyShoes': str(row.get('安全靴', '') or '').strip() or None,
        'glasses': '有' if row.get('眼 ﾒｶﾞﾈ､ｺﾝﾀｸﾄ使用') else '無',
        'carOwner': '有' if row.get('自動車所有') else '無',
        'insurance': '有' if row.get('任意保険加入') else '無',
        'licenseExpiry': to_date_str(row.get('運転免許期限')),
        'education': str(row.get('最終学歴', '') or '').strip() or None,
        'major': str(row.get('専攻', '') or '').strip() or None,
        'commuteMethod': str(row.get('通勤方法', '') or '').strip() or None,
        'commuteTimeMin': row.get('通勤片道時間') if row.get('通勤片道時間') else None,
        'registeredAddress': str(row.get('登録住所', '') or '').strip() or None,

        # Language skills (other languages)
        'otherLanguages': ' / '.join(filter(None, [
            str(row.get('語学スキル有無', '') or '').strip() or None,
            str(row.get('語学スキル有無１', '') or '').strip() or None,
            str(row.get('語学スキル有無2', '') or '').strip() or None,
        ])) or None,

        # JLPT exam details
        'jlptExamTaken': bool(row.get('能力試験受験') and '有' in str(row.get('能力試験受験', ''))),
        'jlptExamDate': str(row.get('能力試験受験日付', '') or '').strip() or None,
        'jlptExamScore': str(row.get('能力試験受験点数', '') or '').strip() or None,
        'jlptExamPlanned': to_date_str(row.get('能力試験受験受験予定')),

        # Nested relations
        'familyMembers': extract_family_members(row),
        'workHistory': extract_work_history(row),
        'qualificationsText': [q for q in [
            str(row.get('有資格取得', '') or '').strip(),
            str(row.get('有資格取得1', '') or '').strip(),
            str(row.get('有資格取得2', '') or '').strip(),
        ] if q],

        # Metadata
        'legacyId': row.get('履歴書ID'),
        '_legacyId': row.get('履歴書ID'),
        'status': 'APPROVED',
    }

    return candidate


# ─── Main Export ─────────────────────────────────────────────────────────

def extract_attachment_image(file_data):
    """Extract image from Access Attachment FileData (20-byte header + image)."""
    if not file_data or len(file_data) < 30:
        return None, None

    raw = file_data if isinstance(file_data, bytes) else bytes(file_data)

    # Access Attachment has a 20-byte header before the actual file data
    # Try to find JPEG/PNG signature
    for sig, ext, _ in IMAGE_SIGNATURES:
        idx = raw.find(sig)
        if idx != -1 and idx < 50:  # Should be within first 50 bytes
            img_data = raw[idx:]
            if ext == '.jpg':
                end = img_data.rfind(b'\xff\xd9')
                if end != -1:
                    img_data = img_data[:end + 2]
            elif ext == '.png':
                iend = img_data.find(b'IEND')
                if iend != -1:
                    img_data = img_data[:iend + 8]
            return img_data, ext

    return None, None


def main():
    os.makedirs(PHOTOS_DIR, exist_ok=True)

    print(f"Connecting to: {DB_PATH}")
    conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={DB_PATH};'
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) FROM [T_履歴書]')
    total = cursor.fetchone()[0]
    print(f"Total records: {total}")

    # Step 1: Load all photo data via Attachment sub-table query
    print("Loading photos from Attachment fields...")
    photo_map = {}  # legacy_id -> base64 data URL
    cursor.execute('SELECT [T_履歴書].[履歴書ID], [写真].[FileName], [写真].[FileData] FROM [T_履歴書]')
    for row in cursor.fetchall():
        lid, fname, fdata = row
        if fdata and len(fdata) > 30:
            img_bytes, ext = extract_attachment_image(fdata)
            if img_bytes and len(img_bytes) > 100:
                photo_map[lid] = image_to_base64_jpg(img_bytes, ext)
                # Also save as JPG backup
                photo_path = os.path.join(PHOTOS_DIR, f"{lid}.jpg")
                if HAS_PIL:
                    try:
                        img = PILImage.open(io.BytesIO(img_bytes))
                        if img.mode in ('RGBA', 'P', 'LA'):
                            img = img.convert('RGB')
                        img.save(photo_path, 'JPEG', quality=85)
                    except Exception:
                        with open(photo_path, 'wb') as f:
                            f.write(img_bytes)
                else:
                    with open(photo_path, 'wb') as f:
                        f.write(img_bytes)

    print(f"  Photos loaded: {len(photo_map)}/{total}")

    # Step 2: Load all candidate data
    print("Loading candidate data...")
    cursor.execute('SELECT * FROM [T_履歴書]')
    columns = [desc[0] for desc in cursor.description]

    candidates = []
    for idx, db_row in enumerate(cursor.fetchall()):
        row = dict(zip(columns, db_row))
        legacy_id = row.get('履歴書ID', idx)
        photo_b64 = photo_map.get(legacy_id)
        candidate = map_candidate(row, photo_b64)
        candidates.append(candidate)

        if (idx + 1) % 200 == 0:
            print(f"  Processed {idx + 1}/{total}...")

    # Write JSON
    json_path = os.path.join(OUTPUT_DIR, 'candidates.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2, default=str)

    conn.close()

    photo_ok = len(photo_map)
    photo_fail = total - photo_ok - (total - 1220)  # adjust for records without photos
    print(f"\nExport complete!")
    print(f"  Candidates: {len(candidates)}")
    print(f"  Photos OK: {photo_ok}")
    print(f"  Photos missing: {total - photo_ok}")
    print(f"  Output: {json_path}")
    print(f"  Photos: {PHOTOS_DIR}/")


if __name__ == '__main__':
    main()
