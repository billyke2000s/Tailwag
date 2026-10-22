"""Additional checks around pinned core extension points; see launch limitations."""
import base64,io,os,subprocess,tempfile
from functools import wraps
from PIL import Image,ImageOps
import asm3.animal,asm3.movement,asm3.media,asm3.onlineform,asm3.utils

def next_collation(dbo):
    if dbo.dbtype=='POSTGRESQL':return dbo.query_int("SELECT nextval('tw_form_collation_id_seq')")
    return dbo.query_int('SELECT MAX(CollationID) FROM onlineformincoming')+1
asm3.onlineform.get_collationid=next_collation

def check_placement(dbo,post):
    kind=post.integer('type')
    if kind not in (1,2) or not post.date('movementdate') or post.date('returndate') is not None:return
    animal=asm3.animal.get_animal(dbo,post.integer('animal'))
    if not animal or animal.get('DECEASEDDATE'):raise asm3.utils.ASMValidationError('A living animal record is required')
    if kind==1 and any(asm3.utils.cint(animal.get(k)) for k in ('ISNOTAVAILABLEFORADOPTION','ISHOLD','ISQUARANTINE','HASPERMANENTFOSTER')):raise asm3.utils.ASMValidationError('This animal is not cleared for adoption')
    person=dbo.first_row(dbo.query('SELECT ID, IDCheck, FosterCapacity, IsFosterer FROM owner WHERE ID = ?',[post.integer('person')]))
    if not person or not person['IDCHECK']:raise asm3.utils.ASMValidationError('A recorded household assessment is required before placement')
    if kind==2:
        capacity=asm3.utils.cint(person['FOSTERCAPACITY'])
        count=dbo.query_int('SELECT COUNT(*) FROM adoption WHERE OwnerID = ? AND MovementType = 2 AND MovementDate IS NOT NULL AND ReturnDate IS NULL AND ID <> ?',[person['ID'],post.integer('movementid')])
        if not person['ISFOSTERER'] or capacity<=0 or count>=capacity:raise asm3.utils.ASMValidationError('Approved foster capacity is unavailable')

original_movement=asm3.movement.validate_movement_form_data
@wraps(original_movement)
def validate_movement(dbo,username,post):
    check_placement(dbo,post);return original_movement(dbo,username,post)
asm3.movement.validate_movement_form_data=validate_movement
original_adopt=asm3.movement.insert_adoption_from_form
@wraps(original_adopt)
def adopt(dbo,username,post,creating=None,create_payments=True,adopt_bonded=True):
    animal=asm3.animal.get_animal(dbo,post.integer('animal'))
    if not animal or animal.get('DECEASEDDATE') or any(asm3.utils.cint(animal.get(k)) for k in ('ISNOTAVAILABLEFORADOPTION','ISHOLD','ISQUARANTINE','HASPERMANENTFOSTER')):raise asm3.utils.ASMValidationError('This animal is not cleared for adoption')
    candidate=dict(post.data);candidate['type']='1';check_placement(dbo,asm3.utils.PostedData(candidate,dbo.locale))
    return original_adopt(dbo,username,post,[] if creating is None else creating,create_payments,adopt_bonded)
asm3.movement.insert_adoption_from_form=adopt
original_foster=asm3.movement.insert_foster_from_form
@wraps(original_foster)
def foster(dbo,username,post):
    candidate=dict(post.data);candidate.update({'type':'2','movementdate':post['fosterdate']});check_placement(dbo,asm3.utils.PostedData(candidate,dbo.locale))
    if dbo.query_int('SELECT COUNT(*) FROM adoption WHERE AnimalID = ? AND MovementDate IS NOT NULL AND ReturnDate IS NULL',[post.integer('animal')]):raise asm3.utils.ASMValidationError('Return the existing placement explicitly before arranging another foster move')
    return original_foster(dbo,username,post)
asm3.movement.insert_foster_from_form=foster
original_upload=asm3.media.attach_file_from_form
@wraps(original_upload)
def upload(dbo,username,linktype,linkid,sourceid,post):
    raw=post['filedata']
    if raw:
        if raw.startswith('data:'):raw=raw.split(',',1)[1]
        try:data=base64.b64decode(raw.replace(' ','+'),validate=True)
        except Exception:raise asm3.utils.ASMValidationError('Invalid upload encoding')
    else:data=post.filedata()
    if not data or len(data)>10*1024*1024:raise asm3.utils.ASMValidationError('Files must be at most 10 MiB')
    if data.startswith(b'%PDF-'):
        scanner=os.getenv('UPLOAD_SCANNER','')
        if not scanner:raise asm3.utils.ASMValidationError('Document scanning must be configured before PDF uploads')
        with tempfile.NamedTemporaryFile(suffix='.pdf') as file:
            file.write(data);file.flush()
            result=subprocess.run([scanner,'--no-summary',file.name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=60)
            if result.returncode:raise asm3.utils.ASMValidationError('Document did not pass scanning')
        mime,extension='application/pdf','pdf'
    else:
        try:
            im=Image.open(io.BytesIO(data))
            if im.format not in ('JPEG','PNG','WEBP') or im.width*im.height>25_000_000:raise ValueError()
            im=ImageOps.exif_transpose(im).convert('RGB');im.thumbnail((2400,2400));out=io.BytesIO();im.save(out,'JPEG',quality=90);data=out.getvalue()
        except Exception:raise asm3.utils.ASMValidationError('Use a valid JPEG, PNG or WebP image')
        mime,extension='image/jpeg','jpg'
    clean=dict(post.data);clean.update({'filedata':'data:'+mime+';base64,'+base64.b64encode(data).decode(),'filetype':mime,'filename':'upload.'+extension})
    return original_upload(dbo,username,linktype,linkid,sourceid,asm3.utils.PostedData(clean,dbo.locale))
asm3.media.attach_file_from_form=upload
