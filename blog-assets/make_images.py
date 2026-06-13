# -*- coding: utf-8 -*-
"""비즈필터 네이버 블로그 자료화면 생성 (Pillow). 2x 슈퍼샘플 후 1080 다운스케일."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
IDX = {"r": 0, "m": 2, "sb": 4, "b": 6}
def F(w, size):
    return ImageFont.truetype(FONT, size, index=IDX[w])

# palette
INK = (22, 35, 58)
ACCENT = (49, 130, 246)
DEEP = (17, 50, 138)
WHITE = (255, 255, 255)
BG = (244, 248, 253)
CARD = (255, 255, 255)
BORDER = (223, 231, 241)
GRAY = (104, 119, 140)
GRAYL = (150, 161, 178)
GO = (6, 168, 107)
GOBG = (224, 245, 236)
NOGO = (224, 64, 56)
NOGOBG = (251, 233, 231)
SLATECARD = (238, 242, 247)

S = 2                # supersample
W = 1080 * S
M = 76 * S

OUT = os.path.dirname(os.path.abspath(__file__))

def canvas(bg):
    img = Image.new("RGB", (W, W), bg)
    return img, ImageDraw.Draw(img)

def tw(d, t, f):
    return d.textlength(t, font=f)

def center(d, t, f, y, fill, cx=W // 2):
    d.text((cx - tw(d, t, f) / 2, y), t, font=f, fill=fill)

def shadow_card(img, box, radius, fill, border=None, bw=0, sh=18, sa=42):
    x0, y0, x1, y1 = box
    sl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sl)
    sd.rounded_rectangle([x0, y0 + sh // 2, x1, y1 + sh], radius=radius,
                         fill=(22, 35, 58, sa))
    sl = sl.filter(ImageFilter.GaussianBlur(sh))
    img.paste(sl, (0, 0), sl)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=radius, fill=fill,
                        outline=border, width=bw)

def logo_mark(d, cx, cy, r):
    # 두 원 + 흰 체크 (BrandMark 근사)
    off = int(r * 0.42)
    d.ellipse([cx - off - r, cy - r, cx - off + r, cy + r], fill=INK)
    d.ellipse([cx + off - r, cy - r, cx + off + r, cy + r], fill=ACCENT)
    lw = max(3, int(r * 0.28))
    p1 = (cx - r * 0.30, cy + r * 0.02)
    p2 = (cx - r * 0.02, cy + r * 0.32)
    p3 = (cx + r * 0.42, cy - r * 0.34)
    d.line([p1, p2, p3], fill=WHITE, width=lw, joint="curve")

def wordmark(d, x, y, size):
    f = F("b", size)
    d.text((x, y), "비즈", font=f, fill=WHITE)
    w1 = tw(d, "비즈", f)
    d.text((x + w1, y), "필터", font=f, fill=(143, 182, 255))

def save(img, name):
    img = img.resize((1080, 1080), Image.LANCZOS)
    path = os.path.join(OUT, name)
    img.save(path, "PNG")
    print("saved", path)

# ── 1. 표지 ──────────────────────────────────────────────
def cover():
    img, d = canvas(INK)
    # 상단 로고
    logo_mark(d, M + 26 * S, M + 24 * S, 26 * S)
    wordmark(d, M + 64 * S, M + 4 * S, 38 * S)
    # 라벨
    lab = F("b", 34 * S)
    center(d, "창업 전 수요 검증", lab, 300 * S, (143, 182, 255))
    # 타이틀
    t1 = F("b", 118 * S)
    center(d, "사업 아이디어 검증", t1, 372 * S, WHITE)
    t2 = F("b", 118 * S)
    center(d, "만들기 전에 끝내는 법", t2, 520 * S, WHITE)
    # 서브
    sub = F("m", 46 * S)
    center(d, "3번 말아먹고 찾은 검증 순서", sub, 700 * S, (176, 190, 212))
    # 하단 라인 + 도메인
    d.line([(M, 880 * S), (W - M, 880 * S)], fill=(54, 70, 100), width=2 * S)
    foot = F("sb", 38 * S)
    center(d, "bizfilter.kr", foot, 910 * S, (143, 182, 255))
    save(img, "01_cover.png")

# ── 2. 실패 흐름 5단계 ──────────────────────────────────
def fail_flow():
    img, d = canvas(BG)
    chip = F("b", 32 * S)
    d.rounded_rectangle([M, M, M + tw(d, " 흔한 실패 순서 ", chip) + 24 * S,
                         M + 56 * S], radius=28 * S, fill=NOGOBG)
    d.text((M + 24 * S, M + 12 * S), "흔한 실패 순서", font=chip, fill=NOGO)
    d.text((M, M + 86 * S), "잘 만들었는데 왜 망했나", font=F("b", 72 * S), fill=INK)

    steps = [
        ("1", "아이디어가 떠오른다", False),
        ("2", "지인에게 말한다  →  “좋다”", False),
        ("3", "몇 달을 들여 만든다", False),
        ("4", "출시한다", False),
        ("5", "아무도 결제하지 않는다", True),
    ]
    top = 250 * S
    rh = 138 * S
    for i, (n, t, bad) in enumerate(steps):
        y = top + i * rh
        box = [M, y, W - M, y + 108 * S]
        fill = NOGOBG if bad else CARD
        bd = NOGO if bad else BORDER
        shadow_card(img, box, 28 * S, fill, border=bd, bw=2 * S, sh=12, sa=26)
        d = ImageDraw.Draw(img)
        cc = NOGO if bad else ACCENT
        d.ellipse([M + 30 * S, y + 26 * S, M + 86 * S, y + 82 * S], fill=cc)
        center(d, n, F("b", 36 * S), y + 34 * S, WHITE, cx=M + 58 * S)
        d.text((M + 120 * S, y + 30 * S), t, font=F("sb", 46 * S),
               fill=NOGO if bad else INK)
        # 화살표
        if i < len(steps) - 1:
            ax = W // 2
            ay = y + 110 * S
            d.polygon([(ax - 11 * S, ay), (ax + 11 * S, ay),
                       (ax, ay + 14 * S)], fill=GRAYL)
    save(img, "02_fail_flow.png")

# ── 3. 좋다 vs 돈 낼게 ─────────────────────────────────
def contrast():
    img, d = canvas(BG)
    center(d, "“좋다” 와 “돈 낼게” 는 다릅니다",
           F("b", 64 * S), M, INK)
    cy0 = 230 * S
    cy1 = W - M
    gap = 36 * S
    cw = (W - 2 * M - gap) // 2
    cols = [
        (M, SLATECARD, GRAY, "“좋다”", GRAY,
         ["지인의 칭찬", "거절이 어색한 대답", "돈이 안 걸린 말"], "= 공짜 신호"),
        (M + cw + gap, CARD, ACCENT, "“돈 낼게”", ACCENT,
         ["모르는 사람의 행동", "결제 버튼 클릭", "지갑을 여는 선택"], "= 진짜 수요"),
    ]
    for x, bg, accent, head, headc, items, foot in cols:
        box = [x, cy0, x + cw, cy1]
        shadow_card(img, box, 36 * S, bg, border=BORDER, bw=2 * S)
        d = ImageDraw.Draw(img)
        # 헤더 배지
        d.rounded_rectangle([x + 40 * S, cy0 + 48 * S, x + cw - 40 * S,
                             cy0 + 150 * S], radius=24 * S, fill=accent)
        center(d, head, F("b", 60 * S), cy0 + 64 * S, WHITE,
               cx=x + cw // 2)
        iy = cy0 + 220 * S
        for it in items:
            d.ellipse([x + 48 * S, iy + 14 * S, x + 64 * S, iy + 30 * S],
                      fill=accent)
            d.text((x + 84 * S, iy), it, font=F("m", 42 * S), fill=INK)
            iy += 90 * S
        center(d, foot, F("b", 48 * S), cy1 - 120 * S, headc, cx=x + cw // 2)
    save(img, "03_contrast.png")

# ── 4. 검증 4단계 ──────────────────────────────────────
def four_steps():
    img, d = canvas(BG)
    chip = F("b", 32 * S)
    d.rounded_rectangle([M, M, M + tw(d, " 만들기 전에 ", chip) + 24 * S,
                         M + 56 * S], radius=28 * S, fill=(225, 236, 255))
    d.text((M + 24 * S, M + 12 * S), "만들기 전에", font=chip, fill=DEEP)
    d.text((M, M + 86 * S), "검증하는 4단계", font=F("b", 72 * S), fill=INK)

    items = [
        ("1", "진짜 같은 한 페이지", "출시된 것처럼 보이게"),
        ("2", "가격을 진짜로 박기", "무료 말고 실제 가격"),
        ("3", "모르는 사람 데려오기", "지인 말고 광고로"),
        ("4", "결제 버튼 클릭률", "방문수 말고 행동"),
    ]
    top = 256 * S
    gap = 34 * S
    cw = (W - 2 * M - gap) // 2
    ch = 296 * S
    for i, (n, t, sub) in enumerate(items):
        cx = M + (i % 2) * (cw + gap)
        cy = top + (i // 2) * (ch + gap)
        box = [cx, cy, cx + cw, cy + ch]
        shadow_card(img, box, 32 * S, CARD, border=BORDER, bw=2 * S)
        d = ImageDraw.Draw(img)
        d.ellipse([cx + 40 * S, cy + 40 * S, cx + 108 * S, cy + 108 * S],
                  fill=ACCENT)
        center(d, n, F("b", 42 * S), cy + 52 * S, WHITE, cx=cx + 74 * S)
        d.text((cx + 40 * S, cy + 150 * S), t, font=F("b", 48 * S), fill=INK)
        d.text((cx + 40 * S, cy + 218 * S), sub, font=F("m", 38 * S),
               fill=GRAY)
    save(img, "04_four_steps.png")

# ── 5. 합격선/결과 예시 ────────────────────────────────
def verdict():
    img, d = canvas(BG)
    center(d, "합격선은 광고 켜기 전에 정합니다", F("b", 60 * S), M, INK)

    box = [M, 220 * S, W - M, 760 * S]
    shadow_card(img, box, 40 * S, CARD, border=BORDER, bw=2 * S)
    d = ImageDraw.Draw(img)
    lab = F("sb", 30 * S)
    d.text((M + 56 * S, 256 * S), "검증 결과 예시", font=lab, fill=GRAYL)
    # 수치 3열
    cols = [("방문", "320"), ("결제 버튼 클릭", "11"), ("100명당", "3.4명")]
    colw = (W - 2 * M - 112 * S) // 3
    yy = 330 * S
    for i, (k, v) in enumerate(cols):
        x = M + 56 * S + i * colw
        d.text((x, yy), k, font=F("m", 34 * S), fill=GRAY)
        vc = ACCENT if i == 2 else INK
        d.text((x, yy + 48 * S), v, font=F("b", 86 * S), fill=vc)
    # 구분선
    d.line([(M + 56 * S, 530 * S), (W - M - 56 * S, 530 * S)],
           fill=BORDER, width=2 * S)
    d.text((M + 56 * S, 568 * S), "합격선", font=F("m", 38 * S), fill=GRAY)
    d.text((M + 56 * S, 616 * S), "100명당 3.0명",
           font=F("sb", 52 * S), fill=INK)
    # GO 스탬프 (회전) — 오른쪽 끝, 텍스트와 겹치지 않게
    st = Image.new("RGBA", (300 * S, 190 * S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    sd.rounded_rectangle([10 * S, 10 * S, 290 * S, 180 * S], radius=26 * S,
                         outline=GO, width=8 * S, fill=GOBG)
    gf = F("b", 108 * S)
    sd.text((150 * S - sd.textlength("GO", font=gf) / 2, 28 * S), "GO",
            font=gf, fill=GO)
    st = st.rotate(7, expand=True, resample=Image.BICUBIC)
    img.paste(st, (W - M - 330 * S, 552 * S), st)
    # 캡션
    d = ImageDraw.Draw(img)
    center(d, "데이터를 본 뒤에는 기준을 바꾸지 않습니다. 그래야 판정이 공정합니다.",
           F("m", 38 * S), 820 * S, GRAY)
    save(img, "05_verdict.png")

cover()
fail_flow()
contrast()
four_steps()
verdict()
print("done")
