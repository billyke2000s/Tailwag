import json,logging,re
import asm3.al

def logmsg(level,msg,location,dbo):
    event=re.sub('[^a-zA-Z0-9_.-]','_',str(location))[:100]
    logging.getLogger('care.events').log({0:10,1:20,2:30,3:40}.get(level,40),json.dumps({'event':event,'level':level}))
asm3.al.logmsg=logmsg
from . import safety
