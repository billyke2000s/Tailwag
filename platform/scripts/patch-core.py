#!/usr/bin/env python3
"""Reproducible GPL modifications; fail closed if upstream anchors change."""
import pathlib,sys
root=pathlib.Path(sys.argv[1])
def replace(file,old,new):
    path=root/file;text=path.read_text()
    if new in text:return
    if text.count(old)!=1:raise RuntimeError(f'Patch no longer applies: {file}')
    path.write_text(text.replace(old,new))
replace('src/asm3/users.py','asm3.al.error("database:%s username:%s password:%s failed authentication from %s [%s]" % (database, username, password, remoteip, useragent), "users.web_login", dbo)','asm3.al.error("authentication_failed", "users.web_login", dbo)')
replace('src/asm3/users.py','rememberme = post["rememberme"] == "on"','rememberme = False # TailWag: do not cache plaintext credentials')
replace('src/asm3/onlineform.py','asm3.al.error(f"spam detected ({spamreason}): {post.data}", "insert_onlineformincoming_from_form", dbo)','asm3.al.error("submission_flagged_for_review", "insert_onlineformincoming_from_form", dbo)')
replace('src/asm3/onlineform.py','asm3.al.warn("failed creating incoming field, cid=%s, name=%s, value=%s: %s" % (collationid, fieldname, v, err),','asm3.al.warn("incoming_field_write_failed cid=%s" % collationid,')
replace('src/asm3/html.py','asm_css_tag("asm-pos.css")','asm_css_tag("asm-pos.css") + asm_css_tag("tailwag.css")')
replace('src/static/js/login.js',"The default username is 'user' with the password 'letmein'","Sign in with the administrator account configured during setup.")
replace('src/static/js/main.js','When you use Move > Foster an animal, ASM will automatically return any open foster movement before moving the animal to its new home.','Return an existing foster placement explicitly before arranging a new foster home.')
replace('src/static/js/change_user_settings.js','$("#button-enable2fa").toggle(u.ENABLETOTP == 0);','$("#button-enable2fa").toggle(u.ENABLETOTP != 1);')
replace('src/asm3/cachedisk.py','        os.unlink(fname)\n    except Exception as err:\n        asm3.al.error(str(err), "cachedisk.delete")','        os.unlink(fname)\n    except FileNotFoundError:\n        pass # An absent cache entry is an expected invalidation result\n    except Exception as err:\n        asm3.al.error(str(err), "cachedisk.delete")')
(root/'src/static/css/tailwag.css').write_text((pathlib.Path(__file__).resolve().parents[1]/'static/staff.css').read_text())
