"""Narrow adapter for the exactly pinned core. No raw core row is public."""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent/'vendor'/'asm'
sys.path.insert(0,str(ROOT/'src'))
import asm3.db,asm3.configuration,asm3.publishers.base,asm3.media,asm3.onlineform,asm3.utils
from . import core_runtime

def database(configured=True):
    dbo=asm3.db.get_database();dbo.installpath=str(ROOT/'src')+'/';dbo.locale='en_GB'
    if configured:
        dbo.locale=asm3.configuration.locale(dbo);dbo.timezone=asm3.configuration.timezone(dbo);dbo.timezone_dst=asm3.configuration.timezone_dst(dbo)
    return dbo

def public_media(dbo,animal_id):
    return dbo.first_row(dbo.query('SELECT ID, MediaNotes FROM media WHERE LinkID = ? AND LinkTypeID = 0 AND WebsitePhoto = 1 AND ExcludeFromPublish = 0 ORDER BY ID DESC',[animal_id]))

def animals():
    dbo=database()
    if asm3.configuration.publisher_use_comments(dbo):raise RuntimeError('Public publishing requires approved website notes, not internal comments')
    rows=asm3.publishers.base.get_animal_data(dbo,None)
    result=[]
    for row in rows:
        if row.get('DECEASEDDATE') or any(asm3.utils.cint(row.get(k,0)) for k in ('ISNOTAVAILABLEFORADOPTION','HASACTIVERESERVE','ISHOLD','ISQUARANTINE','CRUELTYCASE','HASPERMANENTFOSTER','ISCOURTESY')):continue
        if row.get('ACTIVEMOVEMENTDATE') and row.get('ACTIVEMOVEMENTTYPE')==1:continue
        media=public_media(dbo,int(row['ID']))
        if not media or not (media.get('MEDIANOTES') or '').strip():continue
        result.append({'id':int(row['ID']),'name':row.get('ANIMALNAME',''),'species':row.get('SPECIESNAME',''),'breed':row.get('BREEDNAME',''),'age':row.get('ANIMALAGE',''),'sex':row.get('SEXNAME',''),'description':media['MEDIANOTES']})
    return result

def image(animal_id):
    if not any(a['id']==animal_id for a in animals()):raise LookupError('Not public')
    dbo=database();media=public_media(dbo,animal_id)
    if not media:raise LookupError('No approved photo')
    data=asm3.media.get_image_file_data(dbo,'media',str(media['ID']))[1]
    from PIL import Image,ImageOps
    from io import BytesIO
    im=ImageOps.exif_transpose(Image.open(BytesIO(data))).convert('RGB');im.thumbnail((1200,1200))
    out=BytesIO();im.save(out,'JPEG',quality=85);return out.getvalue()

FORM_NAMES={'adopt':'TailWag Adoption','foster':'TailWag Fostering','volunteer':'TailWag Volunteering','contact':'TailWag Contact'}
def submit(kind,data,animal_name,remote_ip,user_agent):
    dbo=database()
    if not any(f['NAME']==FORM_NAMES[kind] for f in asm3.onlineform.get_onlineforms(dbo)):raise RuntimeError('Form not configured')
    payload={'formname':FORM_NAMES[kind],'firstname':data['first_name'],'lastname':data['last_name'],'emailaddress':data['email'],'message':data['message'],'animalname':animal_name,'privacy':'Acknowledged','capacity':data.get('capacity',''),'species':data.get('species','')}
    return asm3.onlineform.insert_onlineformincoming_from_form(dbo,asm3.utils.PostedData(payload,dbo.locale),remote_ip,user_agent)
