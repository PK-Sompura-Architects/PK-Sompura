"""Project photo sets for the Temple Register (Phase 4). For each project: its photos (archive path, crop, alt text,
whether it shows the temple under construction) and 2-3 factual sentences for the page, from the register facts and
what the photos show; no dates, numbers, names or history. Writes the picks into tools/photos/picks.json and the
photo lists + text into src/data/projects.json, then  python tools/photos/export.py <ids>  exports the new photos.
Crops: [left, top, right, bottom] as fractions; they cut camera date stamps and phone watermarks (REDMI | KASHYAP).
Run from the project root:  python tools/photos/project-sets.py
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REDMI = [0, 0, 1, 0.93]           # phone watermark + date along the bottom edge
NIKON = [0, 0, 1, 0.88]           # orange date stamp, bottom right
STAMP = [0, 0, 1, 0.9]

# id: (text, [(src, crop, alt, construction?)])  The first photo is the lead.
SETS = {
 'adpur-dheti-pag': ("A Jain derasar in Adpur, hand-carved and built by the firm. Inside, white marble niches with seated figures line the walls on either side of the sanctum doorway, and the floor is laid with an inlaid marble pattern.", [
  ('OUR WORK PHOTO/upload/adpur gheti pag-2.JPG', None, 'Inside Adpur Dheti Pag: white marble walls with carved niches and seated figures around the sanctum doorway, over an inlaid marble floor', False)]),
 'asha-life-mission': ("A white marble temple designed and built by the firm. A carved gateway with lions on its crown opens onto the courtyard, and inside, the shrine niches and domed ceilings are carved in the same white stone.", [
  ('Asha life mission/IMG-20230224-WA0015.jpg', None, 'Asha Life Mission at dusk: a white marble temple with its shikhara, mandapa and courtyard wall', False),
  ('OUR WORK PHOTO/upload/asha-2.jpg', None, 'The temple seen from its entrance path, a white marble shikhara over a pillared porch on a stepped plinth', False),
  ('Asha life mission/IMG-20230226-WA0003.jpg', [0, 0, 1, 0.86], 'A carved marble gateway with lions on its crown, lit by the evening sun', False),
  ('OUR WORK PHOTO/LIFE MISSION ASHA/IMG_20230224_112500.jpg', REDMI, 'A carved white marble shrine niche', False),
  ('OUR WORK PHOTO/LIFE MISSION ASHA/IMG_20230224_112552.jpg', REDMI, 'Looking up into a carved marble dome', False),
  ('OUR WORK PHOTO/LIFE MISSION ASHA/IMG_20230104_161552.jpg', REDMI, 'The shikhara in scaffolding while the temple was being built', True)]),
 'bhamriya': ("A Hindu temple at Bhamriya built by the firm in white marble. A double flight of steps rises to the pillared entrance, and the domes inside are carved in rings of petals.", [
  ('OUR WORK PHOTO/BHAMRIYA/IMG-20240307-WA0000.jpg', None, 'Bhamriya: a white marble temple above a double flight of steps, its shikhara behind the pillared porch', False),
  ('OUR WORK PHOTO/BHAMRIYA/IMG-20230421-WA0008.jpg', [0, 0, 0.86, 1], 'A white marble dome carved in rings of petals', False),
  ('OUR WORK PHOTO/BHAMRIYA/IMG_20221215_110300.jpg', REDMI, 'Looking up through a carved marble dome to the sky', False),
  ('OUR WORK PHOTO/BHAMRIYA/IMG-20230421-WA0017.jpg', [0, 0, 1, 0.92], 'The shikhara in scaffolding, a crane beside it', True)]),
 'devilaya': ("A Hindu temple hand-carved by the firm in sandstone. A porch of carved columns and scalloped arches stands before the sanctum, under a shikhara banded with carved niches.", [
  ('DEVILAYA/IMG_20190612_114304.jpg', None, 'Devilaya: a sandstone porch of carved columns and scalloped arches', False),
  ('DEVILAYA/IMG_20190612_115357.jpg', None, 'The sandstone shikhara rising behind the porch', False),
  ('DEVILAYA/IMG_20190612_105512.jpg', None, 'Inside the porch: a carved dome over a ring of arches', False),
  ('DEVILAYA/IMG_20190612_105515.jpg', None, 'A carved sandstone dome, its rings of petals closing to a pendant', False)]),
 'digambar-jain-derasar': ("A Jain derasar in Baroda, designed and hand-carved by the firm in sandstone. The facade is carved band over band, with figure panels beside the doorways, carved elephants at the foot of the stair, and a shikhara above.", [
  ('OUR WORK PHOTO/upload/DJD-baroda-2.jpg', None, 'Digambar Jain Derasar, Baroda: a carved sandstone facade and stair, with stone elephants at its foot', False),
  ('OUR WORK PHOTO/upload/DJD-baroda-1.jpg', None, 'The derasar from the front: a carved sandstone facade, side stair and shikhara', False),
  ('DIGAMABAR JAIN DERASAR BARODA/DSCN0307.jpg', None, 'A carved sandstone figure panel beside a doorway', False),
  ('DIGAMABAR JAIN DERASAR BARODA/DSCN0324.jpg', None, 'A brass door set in a carved sandstone frame with figure panels', False),
  ('OUR WORK PHOTO/DIGAMABAR JAIN DERASAR BARODA/DSCN0335.jpg', None, 'Inside: the sanctum doorway in silver, framed by carved stone pillars', False),
  ('DIGAMABAR JAIN DERASAR BARODA/DSCN0311.jpg', None, 'A carved sandstone balcony with pierced railings', False),
  ('OUR WORK PHOTO/upload/DJD-baroda-4.jpg', None, 'Carved sandstone garlands and pendants, a detail of the facade', False),
  ('OUR WORK PHOTO/DIGAMABAR JAIN DERASAR BARODA/DSCN0329.jpg', None, 'The shikhara in scaffolding during construction', True),
  ('OUR WORK PHOTO/DIGAMABAR JAIN DERASAR BARODA/DSCN0302.jpg', None, 'The shikhara rising in scaffolding above the carved walls', True)]),
 'dhola': ("A Jain derasar at Dhola built by the firm in white marble. Three carved shikharas rise above a pillared mandapa, and inside, the ceilings are carved with flowers and rings.", [
  ('OUR WORK PHOTO/DHOLA/20161110_130205.jpg', None, 'Dhola: three white marble shikharas against a blue sky', False),
  ('OUR WORK PHOTO/DHOLA/20161110_131051.jpg', None, 'The derasar from the side: white marble shikharas over an arched, pillared mandapa', False),
  ('Dhola/20161020_164919.jpg', None, 'Inside: a carved marble dome above arches and a shrine', False),
  ('OUR WORK PHOTO/DHOLA/20140802_171539.jpg', None, 'A white marble ceiling panel carved with flowers', False),
  ('OUR WORK PHOTO/DHOLA/20140802_171038.jpg', None, 'The marble walls in scaffolding while the derasar was being built', True)]),
 'gelmata': ("A Hindu temple in Rajkot built by the firm, with CNC-cut work. A white temple with a domed mandapa and a tall shikhara stands at the end of a wide paved court.", [
  ('Gelmata Rajkot/WhatsApp Image 2026-04-16 at 6.33.51 PM.jpeg', None, 'Gelmata, Rajkot: a white temple and its shikhara across a paved court', False),
  ('Gelmata Rajkot/WhatsApp Image 2026-04-16 at 6.33.52 PM.jpeg', None, 'The temple from the side: a domed mandapa and a tall white shikhara', False),
  ('Gelmata Rajkot/WhatsApp Image 2026-04-16 at 6.33.53 PM.jpeg', None, 'The temple from the far end of its court', False),
  ('Gelmata Rajkot/IMG-20170818-WA0013.jpg', None, 'The front of the temple, a stair up to its pillared entrance', False)]),
 'hastgiri': ("A Jain derasar at Hastgiri, designed and built by the firm. Pink sandstone shikharas stand on a hillside above the valley, and inside, a sandstone dome is carved ring within ring.", [
  ('OUR WORK PHOTO/upload/GN1.JPG', None, 'Hastgiri: three pink sandstone shikharas above a hillside', False),
  ('Hastgiri/GN2.JPG', [0.1, 0, 1, 1], 'A pink sandstone temple at the top of a long marble stair', False),
  ('OUR WORK PHOTO/upload/DK2.JPG', None, 'A sandstone shikhara and dome against a cloudy sky', False),
  ('OUR WORK PHOTO/upload/44S2.JPG', None, 'White shikharas seen from above, the hills beyond', False),
  ('OUR WORK PHOTO/HASTGIRI/DSCF5562.JPG', None, 'A sandstone dome carved ring within ring', False)]),
 'jaliya': ("A Jain derasar at Jaliya, hand-carved by the firm in sandstone. The plinth is carved with rows of rosettes, and steps lead up to a pillared mandapa under a carved shikhara.", [
  ('JALIYA/IMG_20220425_165659.jpg', REDMI, 'Jaliya: a sandstone shikhara and pillared mandapa above a paved court', False),
  ('OUR WORK PHOTO/JALIYA/IMG-20220428-WA0004.jpg', None, 'The mandapa from the side, steps up to its carved columns', False),
  ('JALIYA/IMG-20220311-WA0022.jpg', None, 'The sandstone plinth carved with rows of rosettes', False)]),
 'jambudip': ("A Jain derasar at Jambudip, designed by the firm. A domed sandstone temple with carved niches in its walls, under a blue sky.", [
  ('OUR WORK PHOTO/upload/jambudeep-2.JPG', None, 'Jambudip: a domed sandstone temple with carved niches in its walls', False)]),
 'kachhi-bhavan-junagadh': ("A temple in Junagadh built by the firm in white marble, with twin carved shikharas over a pillared porch.", [
  ('OUR WORK PHOTO/upload/KBJ-1.jpg', [0, 0, 0.86, 1], 'Kachhi Bhavan, Junagadh: a white marble temple with twin shikharas', False),
  ('OUR WORK PHOTO/upload/KBJ-2.jpg', None, 'The twin shikharas from the side', False),
  ('KACHHI BHAVAN JUNAGHATH/20140613_170218.jpg', [0, 0, 0.85, 1], 'The white marble porch and its carved columns', False)]),
 'kachhi-bhavan-palitana': ("A temple in Palitana, designed and built by the firm in carved sandstone. The gateway and the walls are carved densely, and the ceilings are carved in geometric patterns.", [
  ('OUR WORK PHOTO/upload/DSCF5664.JPG', [0, 0, 0.72, 1], 'Kachhi Bhavan, Palitana: a carved sandstone temple and its shikhara', False),
  ('OUR WORK PHOTO/upload/DSCF5656.JPG', None, 'A carved sandstone gateway at the top of a stair', False),
  ('OUR WORK PHOTO/upload/DSCF5663.JPG', None, 'Carved sandstone figure panels on the temple wall', False),
  ('OUR WORK PHOTO/upload/DSCF5675.JPG', None, 'A sandstone ceiling carved in a geometric pattern', False)]),
 'khajuri': ("A Hindu temple at Khajuri, hand-carved by the firm in sandstone: a small porch before the sanctum, under a tall carved shikhara.", [
  ('KHAJURI/IMG-20230502-WA0023.jpg', None, 'Khajuri: a sandstone shikhara above a small porch', False),
  ('KHAJURI/IMG-20230502-WA0017.jpg', None, 'The temple from the side, the shikhara and porch', False),
  ('KHAJURI/IMG-20230428-WA0026.jpg', None, 'A carved sandstone ceiling above a doorway', False)]),
 'kotadi': ("A Jain derasar at Kotadi, hand-carved and built by the firm in pink sandstone. Three shikharas stand above a wide stair flanked by stone elephants; the doorways have carved wooden doors, and the ceilings and floors are carved and inlaid.", [
  ('OUR WORK PHOTO/KOTADI/DSCN0605.jpg', None, 'Kotadi: three pink sandstone shikharas above a wide stair with stone elephants', False),
  ('Kotadi/DSCN0609.jpg', None, 'The carved sandstone gateway to the derasar', False),
  ('OUR WORK PHOTO/KOTADI/DSCN0617.jpg', None, 'The shikharas from across the paved terrace', False),
  ('OUR WORK PHOTO/KOTADI/DSCN0610.jpg', None, 'A carved wooden door in a sandstone frame', False),
  ('OUR WORK PHOTO/KOTADI/DSCN0624.jpg', None, 'A carved sandstone figure in a niche', False),
  ('OUR WORK PHOTO/KOTADI/DSCN0654.jpg', None, 'A carved dome above a crystal chandelier', False),
  ('OUR WORK PHOTO/KOTADI/DSCN0613.jpg', None, 'A sandstone ceiling carved with a large flower', False),
  ('OUR WORK PHOTO/KOTADI/DSCN0651.jpg', None, 'An inlaid marble floor with flowers in coloured stone', False),
  ('OUR WORK PHOTO/KOTADI/DSCN0626.jpg', None, 'Carved sandstone columns and wall panels', False)]),
 'liliya': ("A Jain derasar at Liliya, hand-carved by the firm with CNC-cut work. A tall sandstone shikhara rises over a domed mandapa, and steps lead up to the entrance between two smaller shikharas.", [
  ('Liliya/IMG-20210703-WA0010.jpg', None, 'Liliya: a sandstone shikhara and domed mandapa behind a garden', False),
  ('Liliya/IMG-20210703-WA0011.jpg', None, 'The main shikhara between two smaller ones', False),
  ('OUR WORK PHOTO/IMG-20210703-WA0014.jpg', None, 'Steps up to the pillared entrance', False),
  ('OUR WORK PHOTO/LILIYA/IMG-20210702-WA0004.jpg', None, 'Inside a carved sandstone dome', False),
  ('OUR WORK PHOTO/LILIYA/20140925_142309.jpg', None, 'The shikhara nearing completion, stone blocks at its foot', True)]),
 'malav': ("A Jain derasar at Malav built by the firm in pink sandstone, with a carved gateway beside the temple and domes carved in rings of petals.", [
  ('Malav/WhatsApp Image 2026-05-12 at 11.01.27 AM.jpeg', None, 'Malav: a pink sandstone temple front, its entrance hung with garlands', False),
  ('Malav/WhatsApp Image 2026-05-12 at 11.01.28 AM.jpeg', None, 'The entrance lit at dusk', False),
  ('Malav/WhatsApp Image 2026-05-12 at 11.01.29 AM.jpeg', None, 'The temple and its gateway lit at night', False),
  ('Malav/WhatsApp Image 2026-05-12 at 11.14.01 AM.jpeg', None, 'A sandstone dome carved in rings of petals', False)]),
 'mota-derasar': ("A Jain derasar in Tharad, hand-carved by the firm in white marble. A broad stair leads up to a hall of carved pillars, and inside, a wide dome is carved in rings above arched bays.", [
  ('OUR WORK PHOTO/MOTA DERASAR THARAD/D5.jpg', None, 'Mota Derasar, Tharad: a broad white marble stair up to a hall of carved pillars', False),
  ('OUR WORK PHOTO/MOTA DERASAR THARAD/D3 - Copy.jpg', None, 'A carved white marble panel of a figure in motion', False),
  ('OUR WORK PHOTO/MOTA DERASAR THARAD/DSC_0171.jpg', None, 'The carved marble walls rising during construction', True),
  ('OUR WORK PHOTO/MOTA DERASAR THARAD/DSCN0561.jpg', NIKON, 'The shikharas in scaffolding during construction', True)]),
 'osval': ("A temple in Palitana built by the firm: a carved stone dome over a white marble mandapa, with pierced marble screens in its windows.", [
  ('OUR WORK PHOTO/OSVAL PALITANA/DSCF5634.JPG', None, 'Osval, Palitana: a carved temple with a stone dome and white mandapa', False),
  ('OUR WORK PHOTO/OSVAL PALITANA/DSCF5639.jpg', None, 'The carved stone shikhara above white marble', False),
  ('OUR WORK PHOTO/OSVAL PALITANA/DSCF5638.jpg', None, 'A pierced white marble screen in a carved frame', False)]),
 'parvala': ("A Hindu temple at Parvala built by the firm in sandstone: a stepped roof over a pillared porch, and a dome carved in rings inside.", [
  ('OUR WORK PHOTO/PARVALA/20160605_110058.jpg', [0, 0, 0.84, 1], 'Parvala: a sandstone temple with a stepped roof over a pillared porch', False),
  ('OUR WORK PHOTO/PARVALA/20160709_135620.jpg', None, 'A sandstone dome carved in rings', False)]),
 'rampara': ("A Hindu temple at Rampara, hand-carved by the firm in sandstone. Two tall shikharas rise above a broad pillared mandapa reached by a wide stair, and inside, the ceilings are carved in flowers and scrolls.", [
  ('Rampara/IMG-20220415-WA0000.jpg', None, 'Rampara: a sandstone temple with its shikharas above a broad stair and garden', False),
  ('Rampara/WhatsApp Image 2026-05-12 at 11.14.02 AM.jpeg', None, 'The temple and its tall flagpole under a cloudy sky', False),
  ('Rampara/WhatsApp Image 2026-05-12 at 11.14.03 AM.jpeg', None, 'The temple across an open field at dusk', False),
  ('OUR WORK PHOTO/RAMAPARA/20200316_122339.jpg', [0, 0, 0.84, 1], 'Twin sandstone shikharas above a carved mandapa', False),
  ('Rampara/20161113_131507.jpg', None, 'A sandstone ceiling carved with a large rosette', False),
  ('Rampara/20160302_104729.jpg', None, 'Sandstone carved with scrolls and flowers', False),
  ('OUR WORK PHOTO/RAMAPARA/20170107_113027.jpg', None, 'A shikhara in scaffolding during construction', True)]),
 'rrd': ("A Jain derasar in Limbdi, designed by the firm and built with CNC-cut work. A long sandstone temple with shikharas at either end and a pillared mandapa between them, and carved ceilings inside.", [
  ('OUR WORK PHOTO/RRD LIMDI/IMG_20240118_121834.jpg', REDMI, 'RRD, Limbdi: a long sandstone temple with shikharas at either end', False),
  ('IMG_20240118_122022.jpg', REDMI, 'The front of the temple, a wide stair up to the mandapa', False),
  ('OUR WORK PHOTO/RRD LIMDI/IMG_20240118_134027.jpg', REDMI, 'The temple from the side, its tallest shikhara at the left', False),
  ('OUR WORK PHOTO/1 (8).JPG', None, 'A sandstone ceiling carved in squares of rosettes', False),
  ('OUR WORK PHOTO/1 (20).JPG', None, 'The temple with its shikharas in scaffolding', True)]),
 'songadh': ("A Jain derasar at Songadh, hand-carved and built by the firm. A white gateway with red sandstone arches frames the temple beyond it.", [
  ('OUR WORK PHOTO/SONGHATH/20140909_183217.jpg', None, 'Songadh: a white gateway with red arches, the temple framed beyond it', False),
  ('OUR WORK PHOTO/SONGHATH/20140909_183245.jpg', None, 'The gateway and the path to the temple', False)]),
 'taleti': ("A Jain derasar at Taleti, hand-carved by the firm in sandstone: a carved gateway, and figures carved in niches in its walls.", [
  ('OUR WORK PHOTO/upload/DSCF5602.JPG', [0.12, 0, 1, 0.9], 'Taleti: a carved sandstone gateway at the top of a flight of steps', False),
  ('OUR WORK PHOTO/upload/DSCF5606.jpg', [0, 0, 1, 0.84], 'A sandstone figure carved in a niche of the gateway', False)]),
 'vaishno-devi-gulbarga': ("A mountain temple in Gulbarga built by the firm: an artificial mountain of red rock, raised around white shrines. The photographs follow it from the foundation to the finished mountain.", [
  ('IMG_20180620_173801.jpg', None, 'Vaishno Devi, Gulbarga: the red rock mountain and its white shrines in evening light', False),
  ('Gulbarga/IMG-20180619-WA0016.jpg', None, 'The mountain and its shrines in low sun', False),
  ('OUR WORK PHOTO/GULBARGA/IMG-20160303-WA0003.jpg', None, 'Steel reinforcement laid for the foundation', True),
  ('OUR WORK PHOTO/GULBARGA/IMG-20160501-WA0016.jpg', None, 'The stone walls and columns of the core rising', True),
  ('OUR WORK PHOTO/GULBARGA/IMG-20160503-WA0004.jpg', None, 'Curved stone walls of the rock shell taking shape', True)]),
 'vaishno-devi-ahmedabad': ("A mountain temple in Ahmedabad built by the firm: an artificial mountain of red and grey rock with a cave entrance at its foot and white shrines on its slopes.", [
  ('vaishodevi ahmedabad/i3.webp', None, 'Vaishno Devi, Ahmedabad: the finished artificial mountain in red and grey rock, its cave entrance and white shrines above a paved court', False),
  ('vaishodevi ahmedabad/vaishno-devi-temple-ahmedabad.webp', None, 'The rock mountain from the front, a shrine on its slope', False),
  ('vaishodevi ahmedabad/i1.webp', None, 'The mountain and the temple court', False),
  ('vaishodevi ahmedabad/Vaishno-Devi-Temple.webp', None, 'The mountain temple from across the road', False)]),
 'varkhadi': ("A Jain derasar in Tharad, designed and built by the firm, with an artificial rock mountain among its shrines. A carved stone entrance faces the road, and inside, white marble shrines stand in carved niches.", [
  ('OUR WORK PHOTO/VARKHADI THARAD/IMG-20201108-WA0010.jpg', None, 'Varkhadi, Tharad: the carved stone entrance building', False),
  ('OUR WORK PHOTO/VARKHADI THARAD/IMG_20180425_091722.jpg', None, 'The artificial rock mountain, a stair climbing its side', False),
  ('OUR WORK PHOTO/VARKHADI THARAD/V2.jpg', None, 'A white marble shrine inside the temple', False),
  ('OUR WORK PHOTO/VARKHADI THARAD/V5.jpg', None, 'White marble shrine niches with seated figures', False),
  ('OUR WORK PHOTO/VARKHADI THARAD/DSC_0108.JPG', None, 'The rock mountain under construction, shrines among the boulders', True),
  ('OUR WORK PHOTO/VARKHADI THARAD/DSCN0497.jpg', None, 'The main temple in scaffolding', True)]),
}

# AVIF quality of the lead photo (each page's LCP): 45, lower for leads whose detail makes the file heavy.
LEAD_Q = {'adpur-dheti-pag': 40}

# Detail tiles for projects with a single photo: crops of that photo at full resolution, at least 600 px of real pixels.
DETAILS = {
 'adpur-dheti-pag': [
  ('OUR WORK PHOTO/upload/adpur gheti pag-2.JPG', [0.36, 0.36, 0.66, 0.76], 'Detail: the sanctum doorway, a carved frame around the dark stone idol'),
  ('OUR WORK PHOTO/upload/adpur gheti pag-2.JPG', [0.08, 0.33, 0.38, 0.73], 'Detail: a carved white marble niche with a seated figure')],
 'jambudip': [
  ('OUR WORK PHOTO/upload/jambudeep-2.JPG', [0.36, 0.06, 0.66, 0.46], 'Detail: the domes, carved in overlapping petals, under the stepped roof'),
  ('OUR WORK PHOTO/upload/jambudeep-2.JPG', [0.56, 0.48, 0.86, 0.88], 'Detail: a carved stone window screen beside a carved pillar')],
}

if __name__ == '__main__':
    picks_path = ROOT / 'tools/photos/picks.json'
    picks = json.loads(picks_path.read_text(encoding='utf-8'))
    projects_path = ROOT / 'src/data/projects.json'
    projects = json.loads(projects_path.read_text(encoding='utf-8'))
    # drop the old single-photo picks for every project in SETS, then add the new set
    for pid in SETS:
        for k in [k for k in picks if k == pid or k.startswith(pid + '--')]:  # photos and details
            del picks[k]
    changed = []
    for p in projects:
        if p['id'] not in SETS:
            continue
        text, photos = SETS[p['id']]
        p['text'] = text
        p['photos'] = []
        for i, (src, crop, alt, building) in enumerate(photos, 1):
            key = f"{p['id']}--{i}"
            picks[key] = {'src': src, 'alt': alt, **({'crop': crop} if crop else {}), **({'max': 1600} if i > 1 else {'avif_q': LEAD_Q.get(p['id'], 45)})}  # the lead is the page's LCP: lighter AVIF
            p['photos'].append({'label': alt, 'src': key, **({'construction': True} if building else {})})
            changed.append(key)
    for p in projects:
        for i, (src, crop, alt) in enumerate(DETAILS.get(p['id'], []), 1):
            key = f"{p['id']}--d{i}"
            picks[key] = {'src': src, 'alt': alt, 'crop': crop}
            p.setdefault('details', [])
            p['details'] = [d for d in p['details'] if d['src'] != key] + [{'label': alt, 'src': key}]
            changed.append(key)
    picks_path.write_text(json.dumps(picks, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    projects_path.write_text(json.dumps(projects, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print(len(changed), 'photos in', len(SETS), 'projects')
    if '--export' in sys.argv:
        subprocess.run([sys.executable, str(ROOT / 'tools/photos/export.py'), *changed], check=True)
