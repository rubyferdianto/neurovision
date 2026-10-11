"""Vendor a curated CC0 Poly Haven collection with its original PBR textures."""
import concurrent.futures, hashlib, json, urllib.request
from pathlib import Path

ROWS = [
 ('food_apple_01','Apple','food','apple'),('bananas','Bananas','food','banana'),('lemon','Lemon','food','lemon'),('football','Football','sport','soccer ball|football|ball'),
 ('baseball_01','Baseball','sport','baseball'),('yellow_onion','Onion','food','onion'),('wooden_spoon','Wooden spoon','kitchen','spoon|wooden spoon'),('croissant','Croissant','food','croissant'),
 ('food_avocado_01','Avocado','food','avocado'),('food_kiwi_01','Kiwi','food','kiwi|kiwi fruit'),('food_pomegranate_01','Pomegranate','food','pomegranate'),('food_ginger_01','Ginger','food','ginger'),
 ('lightbulb_01','Light bulb','household','light bulb|lightbulb|bulb'),('jug_01','Jug','kitchen','jug|pitcher'),('wooden_bowl_01','Wooden bowl','kitchen','bowl|wooden bowl'),('watering_can_metal_01','Watering can','garden','watering can'),
 ('Camera_01','Camera','electronics','camera'),('gamepad','Game controller','electronics','gamepad|controller|game controller'),('binoculars','Binoculars','optics','binoculars'),('vintage_electric_kettle','Kettle','kitchen','kettle|electric kettle'),
 ('alarm_clock_01','Alarm clock','time','clock|alarm clock'),('vintage_suitcase','Suitcase','travel','suitcase|luggage'),('rubber_boots','Rubber boots','clothing','boots|rubber boots|wellingtons'),('fishermans_hat','Bucket hat','clothing','hat|bucket hat|fisherman hat'),
 ('pocket_watch','Pocket watch','time','pocket watch|watch'),('magnifying_glass_01','Magnifying glass','optics','magnifying glass|magnifier'),('measuring_tape_01','Tape measure','tools','tape measure|measuring tape'),('vintage_stapler','Stapler','office','stapler'),
 ('adjustable_wrench','Adjustable wrench','tools','adjustable wrench|wrench|spanner'),('screwdriver','Screwdriver','tools','screwdriver'),('pliers','Pliers','tools','pliers'),('cross_pein_hammer','Hammer','tools','hammer'),
 ('seadogs_compass','Compass','instruments','compass'),('brass_blowtorch','Blowtorch','tools','blowtorch|blow torch'),('bunsen_burner','Bunsen burner','instruments','bunsen burner|burner'),('vintage_microscope','Microscope','optics','microscope'),
 ('hand_plane_no4','Hand plane','tools','hand plane|wood plane|plane'),('retro_multimeter','Multimeter','instruments','multimeter|volt meter|voltmeter'),('filmstrip_projector_8mm','Film projector','electronics','projector|film projector'),('cassette_player','Cassette player','electronics','cassette player|tape player'),
 ('Ukulele_01','Ukulele','music','ukulele|uke'),('Lantern_01','Lantern','household','lantern'),('chess_set','Chess set','games','chess|chess set'),('circuit_board','Circuit board','electronics','circuit board|pcb'),
 ('life_jacket','Life jacket','travel','life jacket|life vest'),('Megaphone_01','Megaphone','electronics','megaphone|bullhorn'),('dustpan','Dustpan','household','dustpan|dust pan'),('Barrel_01','Barrel','household','barrel|cask')
]
ROOT=Path(__file__).resolve().parents[1]
def read(url):
    return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'NeuroVision/1.0 (CC0 educational game assets)'}),timeout=90).read()
def download(url,path,checksum=None):
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists() and (not checksum or hashlib.md5(path.read_bytes()).hexdigest()==checksum): return
    payload=read(url)
    if checksum and hashlib.md5(payload).hexdigest()!=checksum: raise ValueError('Checksum mismatch: '+url)
    path.write_bytes(payload)
def fetch(row):
    asset,label,category,aliases=row
    cache=ROOT/'tmp'/f'{asset}.json'
    if not cache.exists(): cache.write_bytes(read('https://api.polyhaven.com/files/'+asset))
    files=json.loads(cache.read_text(encoding='utf-8'))['gltf']['1k']['gltf']
    folder=ROOT/'assets'/'objects'/asset
    total=files['size']+sum(f['size'] for f in files['include'].values())
    if total>45_000_000: raise ValueError(f'{asset} is too large: {total}')
    download(files['url'],folder/'model.gltf',files.get('md5'))
    for relative,info in files['include'].items():
        target=(folder/relative).resolve()
        if not target.is_relative_to(folder.resolve()): raise ValueError('Unsafe asset path')
        download(info['url'],target,info.get('md5'))
    print(f'{asset}: {total/1e6:.1f} MB',flush=True)
    return {'id':asset,'label':label,'category':category,'aliases':aliases.split('|'),'tier':ROWS.index(row)//8+1,'model':f'assets/objects/{asset}/model.gltf','source':'https://polyhaven.com/a/'+asset,'bytes':total}
if __name__=='__main__':
    (ROOT/'tmp').mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: items=list(pool.map(fetch,ROWS))
    (ROOT/'assets'/'objects'/'catalog.json').write_text(json.dumps(items,indent=2)+'\n',encoding='utf-8')
    (ROOT/'assets'/'objects'/'catalog.js').write_text('window.REAL_OBJECTS = '+json.dumps(items,indent=2)+';\n',encoding='utf-8')
    (ROOT/'assets'/'objects'/'CREDITS.md').write_text('# Realistic object collection\n\n48 original Poly Haven models and their 1K PBR textures. Assets are CC0: https://polyhaven.com/license\n\n'+''.join(f"- [{x['label']}]({x['source']})\n" for x in items),encoding='utf-8')
    print(f'Total: {sum(x["bytes"] for x in items)/1e6:.1f} MB')
