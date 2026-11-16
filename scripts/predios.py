"""Prédios 3D das contribuições girando, como animação WebP fluida.

Cada dia com contribuição no último ano é um prédio roxo; a altura e o tom vêm das
contribuições do dia. O conjunto dá uma volta completa em loop.
Gera assets/predios.webp (PT) e assets/buildings.webp (EN).

Uso: GITHUB_TOKEN=... USERNAME=... python3 scripts/predios.py
     MOCK=1 python3 scripts/predios.py   (dados de exemplo, para testar)
"""
import datetime as dt, json, math, os, random, urllib.request
from PIL import Image, ImageDraw, ImageFont

W, H, SS = 860, 420, 2            # tamanho final e supersampling
QUADROS, MS = 200, 36             # 200 quadros x 36 ms = volta de 7,2 s (~28 fps)
CX, CY, S, TILT = W / 2, 262, 12.5, 0.42
BASE = [None, (92, 52, 168), (118, 72, 214), (150, 102, 245), (190, 150, 255)]
TXT = {
    'pt': ('contribuições no último ano', 'cada prédio é um dia · quanto mais alto, mais contribuições', 'assets/predios.webp'),
    'en': ('contributions in the last year', 'every building is a day · taller means more contributions', 'assets/buildings.webp'),
}
NIVEL = {'NONE': 0, 'FIRST_QUARTILE': 1, 'SECOND_QUARTILE': 2, 'THIRD_QUARTILE': 3, 'FOURTH_QUARTILE': 4}


def buscar():
    if os.environ.get('MOCK'):
        random.seed(4)
        semanas = []
        for w in range(53):
            dias = []
            for d in range(7):
                n = (random.random() < .8) * random.randint(0, 12) if w > 42 else int(random.random() < .04)
                dias.append({'contributionCount': n, 'contributionLevel': 0 if n == 0 else 1 if n < 3 else 2 if n < 6 else 3 if n < 9 else 4, 'weekday': d})
            semanas.append(dias)
        return sum(d['contributionCount'] for s in semanas for d in s), semanas
    q = 'query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{weekday contributionCount contributionLevel}}}}}}'
    req = urllib.request.Request('https://api.github.com/graphql', data=json.dumps({'query': q, 'variables': {'u': os.environ['USERNAME']}}).encode(),
                                 headers={'Authorization': f"bearer {os.environ['GITHUB_TOKEN']}", 'Content-Type': 'application/json'})
    cal = json.load(urllib.request.urlopen(req))['data']['user']['contributionsCollection']['contributionCalendar']
    semanas = [[{**d, 'contributionLevel': NIVEL[d['contributionLevel']]} for d in w['contributionDays']] for w in cal['weeks']]
    return cal['totalContributions'], semanas


def fonte(tam, negrito=False):
    nome = 'DejaVuSans-Bold.ttf' if negrito else 'DejaVuSans.ttf'
    try:
        return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/' + nome, tam)
    except OSError:
        return ImageFont.load_default(size=tam)


def fundo():
    """Fundo fixo (gradiente radial roxo escuro + borda), desenhado uma vez."""
    img = Image.new('RGB', (W * SS, H * SS), (10, 6, 22))
    px = img.load()
    cx, cy, r = W * SS * .5, H * SS * .62, W * SS * .7
    c0, c1, c2 = (42, 21, 89), (20, 11, 43), (10, 6, 22)
    for y in range(0, H * SS, 2):
        for x in range(0, W * SS, 2):
            t = min(1, math.hypot(x - cx, (y - cy) * 1.4) / r)
            a, b, k = (c0, c1, t / .55) if t < .55 else (c1, c2, (t - .55) / .45)
            c = tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))
            px[x, y] = c
            if x + 1 < W * SS: px[x + 1, y] = c
            if y + 1 < H * SS:
                px[x, y + 1] = c
                if x + 1 < W * SS: px[x + 1, y + 1] = c
    return img


def quadro(base, barras, ang):
    img = base.copy()
    d = ImageDraw.Draw(img, 'RGBA')
    c, s, st, ct = math.cos(ang), math.sin(ang), math.sin(TILT), math.cos(TILT)

    def proj(x, z, y):
        xr, zr = x * c - z * s, x * s + z * c
        return ((CX + xr * S) * SS, (CY + zr * S * st - y * S * ct * 1.6) * SS, zr)

    piso = [proj(x, z, 0)[:2] for x, z in ((-27.2, -4.2), (27.2, -4.2), (27.2, 4.2), (-27.2, 4.2))]
    d.polygon(piso, fill=(42, 26, 79, 140), outline=(109, 67, 201, 115), width=SS)
    lado = .4
    for b in sorted(barras, key=lambda b: proj(b['x'], b['z'], 0)[2]):
        cantos = [(b['x'] + dx, b['z'] + dz) for dx, dz in ((-lado, -lado), (lado, -lado), (lado, lado), (-lado, lado))]
        bot = [proj(x, z, 0)[:2] for x, z in cantos]
        top = [proj(x, z, b['h'])[:2] for x, z in cantos]
        for i, (nx, nz) in enumerate(((0, -1), (1, 0), (0, 1), (-1, 0))):
            nzr = nx * s + nz * c
            if nzr <= 0:
                continue
            nxr = nx * c - nz * s
            luz = .55 + .35 * max(0, -.6 * nxr + .8 * nzr)
            j = (i + 1) % 4
            d.polygon([bot[i], bot[j], top[j], top[i]], fill=tuple(min(255, int(v * luz)) for v in b['rgb']))
        d.polygon(top, fill=tuple(min(255, int(v * 1.18)) for v in b['rgb']))
    return img


def main():
    total, semanas = buscar()
    dias = [(w, d) for w, s in enumerate(semanas) for d in s]
    mx = max([1] + [d['contributionCount'] for _, d in dias])
    barras = [{'x': w - (len(semanas) - 1) / 2, 'z': d['weekday'] - 3,
               'h': .35 + math.sqrt(d['contributionCount'] / mx) * 7.5,
               'rgb': BASE[max(1, d['contributionLevel'])]} for w, d in dias if d['contributionCount'] > 0]
    base = fundo()
    quadros = [quadro(base, barras, k / QUADROS * 2 * math.pi + .35) for k in range(QUADROS)]
    os.makedirs('assets', exist_ok=True)
    for lang, (titulo, sub, arq) in TXT.items():
        saida = []
        num = f"{total:,}".replace(',', '.' if lang == 'pt' else ',')
        for q in quadros:
            im = q.copy()
            d = ImageDraw.Draw(im)
            f1, f2 = fonte(15 * SS, True), fonte(11 * SS)
            d.text((18 * SS, 16 * SS), num, font=f1, fill=(192, 132, 252))
            d.text((18 * SS + d.textlength(num + ' ', font=f1), 16 * SS), titulo, font=f1, fill=(243, 232, 255))
            d.text((18 * SS, 40 * SS), sub, font=f2, fill=(139, 123, 176))
            d.rounded_rectangle([0, 0, W * SS - 1, H * SS - 1], radius=10 * SS, outline=(59, 37, 102), width=SS)
            saida.append(im.resize((W, H), Image.LANCZOS))
        saida[0].save(arq, save_all=True, append_images=saida[1:], duration=MS, loop=0, quality=82, method=4)
        print(arq, os.path.getsize(arq) // 1024, 'KB')
    print(total, 'contribuições')


main()
