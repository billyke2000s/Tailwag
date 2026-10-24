#!/usr/bin/env python3
"""Checked native care extension points; exact upstream bodies are hash-verified."""

import hashlib
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])


def patch_method(file, container, name, js, expected, replacement):
    path = root / file
    text = path.read_text()
    marker = ("        " + name + ": function() {") if js else ("    def " + name + "(")
    start = text.index(marker, text.index(container) if container else 0)
    pattern = r"\n        [a-z_]+: (?:function|\{)" if js else r"\n    def |\nclass "
    match = re.search(pattern, text[start + 1 :])
    end = start + 1 + match.start() if match else len(text)
    old = text[start:end]
    if old == replacement:
        return
    if hashlib.sha256(old.encode()).hexdigest() != expected:
        raise RuntimeError(f"Care patch no longer applies: {file}:{container}:{name}")
    path.write_text(text[:start] + replacement + text[end:])


patch_method(
    "src/main.py",
    "class medical(",
    "post_given",
    False,
    "3580eb169040ecf422e048f2fe8f67fa55f029c47101f0e0c15f2be308cc7772",
    "    def post_given(self, o):\n        self.check(asm3.users.BULK_COMPLETE_MEDICAL)\n        from shelter.care import check_access, record_care\n        check_access(o.dbo, o.post, 'medical', self.check_animal)\n        return record_care(o.dbo, o.user, o.post, 'medical', undo=False)\n",
)
patch_method(
    "src/main.py",
    "class medical(",
    "post_undo",
    False,
    "35352e8b09ab0a71f315763ba0b37ded085fe522275e0ccc4d47ec758de7c36a",
    "    def post_undo(self, o):\n        self.check(asm3.users.BULK_COMPLETE_MEDICAL)\n        from shelter.care import check_access, record_care\n        check_access(o.dbo, o.post, 'medical', self.check_animal)\n        return record_care(o.dbo, o.user, o.post, 'medical', undo=True)\n",
)
patch_method(
    "src/main.py",
    "class test(",
    "post_perform",
    False,
    "a4eddd34240ae8a1bea7bb6fa09088932c186069affb1bbaf2e980951c309b26",
    "    def post_perform(self, o):\n        self.check(asm3.users.CHANGE_TEST)\n        from shelter.care import check_access, record_care\n        check_access(o.dbo, o.post, 'test', self.check_animal)\n        return record_care(o.dbo, o.user, o.post, 'test', undo=False)\n",
)
patch_method(
    "src/main.py",
    "class vaccination(",
    "post_given",
    False,
    "920f07c469fb6ce8934df6b79666368d5acdbad975104ea4ad852a6d2ce1a1e7",
    "    def post_given(self, o):\n        self.check(asm3.users.BULK_COMPLETE_VACCINATION)\n        from shelter.care import check_access, record_care\n        check_access(o.dbo, o.post, 'vaccination', self.check_animal)\n        return record_care(o.dbo, o.user, o.post, 'vaccination', undo=False)\n",
)
patch_method(
    "src/main.py",
    "class mobile(",
    "post_medical",
    False,
    "ff27b5f82c575502ad5a108fa961e109b885b44c745e948e466588955a88862a",
    "    def post_medical(self, o):\n        self.check(asm3.users.CHANGE_MEDICAL)\n        from shelter.care import check_access, record_mobile_care\n        check_access(o.dbo, o.post, 'medical', self.check_animal, mobile=True)\n        return record_mobile_care(o.dbo, o.user, o.post, 'medical')\n",
)
patch_method(
    "src/main.py",
    "class mobile(",
    "post_test",
    False,
    "525b94182b2abe1aa00762f46f6755fff4e306a52d7ee727c2f580fa3fa642ef",
    "    def post_test(self, o):\n        self.check(asm3.users.CHANGE_TEST)\n        from shelter.care import check_access, record_mobile_care\n        check_access(o.dbo, o.post, 'test', self.check_animal, mobile=True)\n        return record_mobile_care(o.dbo, o.user, o.post, 'test')\n",
)
patch_method(
    "src/main.py",
    "class mobile(",
    "post_vaccinate",
    False,
    "4864a36a214d14b6485dca5a606efad618109f10f5f473bcbbb84bd461bb87ec",
    "    def post_vaccinate(self, o):\n        self.check(asm3.users.CHANGE_VACCINATION)\n        from shelter.care import check_access, record_mobile_care\n        check_access(o.dbo, o.post, 'vaccination', self.check_animal, mobile=True)\n        return record_mobile_care(o.dbo, o.user, o.post, 'vaccination')\n",
)
patch_method(
    "src/main.py",
    "class medical(",
    "controller",
    False,
    "6e007ec3dbe05314932f2b11b90ec0bf5ff749d3f2d02b99ded60feaf5d7e7a2",
    '    def controller(self, o):\n        dbo = o.dbo\n        offset = o.post["offset"]\n        if offset == "": offset = "m365"\n        med = asm3.medical.get_treatments_outstanding(dbo, offset, o.lf)\n        profiles = asm3.medical.get_profiles(dbo)\n        asm3.al.debug("got %d medical treatments" % len(med), "main.medical", dbo)\n        from shelter.care import add_versions\n        add_versions(dbo, med, \'medical\')\n        return {\n            "profiles": profiles,\n            "rows": med,\n            "overlimit": 0,\n            "newmed": o.post.integer("newmed") == 1,\n            "name": "medical",\n            "stockitems": asm3.stock.get_stock_items(dbo),\n            "stockusagetypes": asm3.lookups.get_stock_usage_types(dbo),\n            "templates": asm3.template.get_document_templates(dbo, "medical"),\n            "users": asm3.users.get_users(dbo),\n            "medicaltypes": asm3.lookups.get_medical_types(dbo)\n        }\n',
)
patch_method(
    "src/main.py",
    "class animal_medical(",
    "controller",
    False,
    "ee9af057557026e9e56b757ddf0a4d3e87096b3b936306f6c59758194e4c18bb",
    '    def controller(self, o):\n        dbo = o.dbo\n        a = asm3.animal.get_animal(dbo, o.post.integer("id"))\n        if a is None: self.notfound()\n        self.check_animal(a)\n        limit = asm3.configuration.medical_item_display_limit(dbo)\n        med = asm3.medical.get_regimens_treatments(dbo, o.post.integer("id"), limit=limit)\n        profiles = asm3.medical.get_profiles(dbo)\n        asm3.al.debug("got %d medical entries for animal %s %s" % (len(med), a["CODE"], a["ANIMALNAME"]), "main.animal_medical", dbo)\n        from shelter.care import add_versions\n        add_versions(dbo, med, \'medical\')\n        return {\n            "profiles": profiles,\n            "rows": med,\n            "overlimit": len(med) == limit and limit or 0,\n            "name": "animal_medical",\n            "tabcounts": asm3.animal.get_satellite_counts(dbo, a["ID"])[0],\n            "stockitems": asm3.stock.get_stock_items(dbo),\n            "stockusagetypes": asm3.lookups.get_stock_usage_types(dbo),\n            "templates": asm3.template.get_document_templates(dbo, "medical"),\n            "users": asm3.users.get_users(dbo),\n            "animal": a,\n            "medicaltypes": asm3.lookups.get_medical_types(dbo)\n        }\n',
)
patch_method(
    "src/main.py",
    "class test(",
    "controller",
    False,
    "fb394cd253123e7b0fce957ecf696de775b1be972f6545cabf68a962858545f4",
    '    def controller(self, o):\n        dbo = o.dbo\n        offset = o.post["offset"]\n        if offset == "": offset = "m365"\n        test = asm3.medical.get_tests_outstanding(dbo, offset, o.lf)\n        asm3.al.debug("got %d tests" % len(test), "main.test", dbo)\n        from shelter.care import add_versions\n        add_versions(dbo, test, \'test\')\n        return {\n            "name": "test",\n            "newtest": o.post.integer("newtest") == 1,\n            "rows": test,\n            "stockitems": asm3.stock.get_stock_items(dbo),\n            "stockusagetypes": asm3.lookups.get_stock_usage_types(dbo),\n            "testtypes": asm3.lookups.get_test_types(dbo),\n            "testresults": asm3.lookups.get_test_results(dbo)\n        }\n',
)
patch_method(
    "src/main.py",
    "class animal_test(",
    "controller",
    False,
    "48f33edd656633cdaec930b7f5009140b9cae1ed9ab287a9252f212a02391408",
    '    def controller(self, o):\n        dbo = o.dbo\n        a = asm3.animal.get_animal(dbo, o.post.integer("id"))\n        if a is None: self.notfound()\n        self.check_animal(a)\n        test = asm3.medical.get_tests(dbo, o.post.integer("id"))\n        asm3.al.debug("got %d tests" % len(test), "main.animal_test", dbo)\n        from shelter.care import add_versions\n        add_versions(dbo, test, \'test\')\n        return {\n            "name": "animal_test",\n            "animal": a,\n            "tabcounts": asm3.animal.get_satellite_counts(dbo, a["ID"])[0],\n            "rows": test,\n            "stockitems": asm3.stock.get_stock_items(dbo),\n            "stockusagetypes": asm3.lookups.get_stock_usage_types(dbo),\n            "testtypes": asm3.lookups.get_test_types(dbo),\n            "testresults": asm3.lookups.get_test_results(dbo)\n        }\n',
)
patch_method(
    "src/main.py",
    "class vaccination(",
    "controller",
    False,
    "a25c9ef5985f231afce603a606d462a6cd598d1461da150f6b6f4ac0c1ec7e11",
    '    def controller(self, o):\n        dbo = o.dbo\n        offset = o.post["offset"]\n        if offset == "": offset = "m365"\n        vacc = asm3.medical.get_vaccinations_outstanding(dbo, offset, o.lf)\n        asm3.al.debug("got %d vaccinations" % len(vacc), "main.vaccination", dbo)\n        from shelter.care import add_versions\n        add_versions(dbo, vacc, \'vaccination\')\n        return {\n            "name": "vaccination",\n            "newvacc": o.post.integer("newvacc") == 1,\n            "rows": vacc,\n            "batches": asm3.medical.get_batch_for_vaccination_types(dbo),\n            "manufacturers": "|".join(asm3.medical.get_vacc_manufacturers(dbo)),\n            "stockitems": asm3.stock.get_stock_items(dbo),\n            "stockusagetypes": asm3.lookups.get_stock_usage_types(dbo),\n            "users": asm3.users.get_users(dbo),\n            "vaccinationtypes": asm3.lookups.get_vaccination_types(dbo)\n        }\n',
)
patch_method(
    "src/main.py",
    "class animal_vaccination(",
    "controller",
    False,
    "67c3323283cb830a638188a27957e5f8d0a9eb4ab7e150c1baa68c4a701039c0",
    '    def controller(self, o):\n        dbo = o.dbo\n        a = asm3.animal.get_animal(dbo, o.post.integer("id"))\n        if a is None: self.notfound()\n        self.check_animal(a)\n        vacc = asm3.medical.get_vaccinations(dbo, o.post.integer("id"))\n        asm3.al.debug("got %d vaccinations" % len(vacc), "main.vaccination", dbo)\n        from shelter.care import add_versions\n        add_versions(dbo, vacc, \'vaccination\')\n        return {\n            "name": "animal_vaccination",\n            "animal": a,\n            "tabcounts": asm3.animal.get_satellite_counts(dbo, a["ID"])[0],\n            "rows": vacc,\n            "batches": asm3.medical.get_batch_for_vaccination_types(dbo),\n            "manufacturers": "|".join(asm3.medical.get_vacc_manufacturers(dbo)),\n            "stockitems": asm3.stock.get_stock_items(dbo),\n            "stockusagetypes": asm3.lookups.get_stock_usage_types(dbo),\n            "users": asm3.users.get_users(dbo),\n            "vaccinationtypes": asm3.lookups.get_vaccination_types(dbo)\n        }\n',
)
patch_method(
    "src/static/js/medical.js",
    "",
    "bind_givendialog",
    True,
    "f71c014da50c55441b9c51966dbdacab324f57bd28737e950c783e5d066901a6",
    "        bind_givendialog: function() {\n            window.tailwagCare.bind('medical', () => medical.selected_treatment_ids());\n        },\n",
)
patch_method(
    "src/static/js/medical.js",
    "",
    "render_givendialog",
    True,
    "7e82b2abf52e35a1f364e57745018069c6deaadb30c69721c13b5bb95ba85b4b",
    '        render_givendialog: function() {\n            return [\n                \'<div id="dialog-given" style="display: none" title="\' + html.title(_("Give Treatments")) + \'">\',\n                tableform.fields_render(window.tailwagCare.fields(\'medical\')),\n                tableform.fields_render([\n                    { post_field: "newdate", type: "date", label: _("Given"), date_nofuture: true },\n                    { post_field: "newtime", type: "time", label: _("at") },\n                    { post_field: "givenby", type: "select", label: _("By"), addifmissing: true, \n                        options: { displayfield: "USERNAME", valuefield: "USERNAME", rows: controller.users, prepend: \'<option value=""></option>\' }},\n                    { post_field: "givenvet", type: "person", label: _("Administering Vet"), personfilter: "vet" },\n                    { post_field: "treatmentcomments", type: "textarea", label: _("Comments") },\n                    { type: "raw", fullrow: true, rowclasses: "tagstock", \n                        markup: \'<p class="asm-header">\' + _("Stock") + \n                            \' <span id="callout-stock" class="asm-callout">\' + \n                            _("These fields allow you to deduct stock for the treatment(s) given. This single deduction should cover the selected treatments being administered.") + \n                            \'</span></p>\' },\n                    { post_field: "item", type: "select", label: _("Item"), rowclasses: "tagstock", \n                        options: { displayfield: "ITEMNAME", rows: controller.stockitems, prepend: \'<option value="-1">\' + _("(no deduction)") + \'</option>\'} },\n                    { post_field: "quantity", type: "number", label: _("Quantity"), rowclasses: "tagstock" },\n                    { post_field: "usagetype", type: "select", label: _("Usage Type"), rowclasses: "tagstock", \n                        options: { displayfield: "USAGETYPENAME", rows: controller.stockusagetypes}},\n                    { post_field: "usagedate", type: "date", label: _("Usage Date"), rowclasses: "tagstock" },\n                    { post_field: "usagecomments", type: "textarea", label: _("Comments"), rowclasses: "tagstock" }\n\n                ]),\n                \'</div>\'\n            ].join("\\n");\n        },\n',
)
patch_method(
    "src/static/js/vaccination.js",
    "",
    "bind_givendialog",
    True,
    "6c5adef8c380430e0927e9965c85f90c24b9278ea5dce34fe674cbde6838d8a5",
    "        bind_givendialog: function() {\n            window.tailwagCare.bind('vaccination', () => tableform.table_ids(vaccination.table));\n        },\n",
)
patch_method(
    "src/static/js/vaccination.js",
    "",
    "render_givendialog",
    True,
    "05d62581ef71fb20c5320ec32af31a1bacf3f86862c152538af1cca2c90bfafb",
    '        render_givendialog: function() {\n            return [\n                \'<div id="dialog-given" style="display: none" title="\' + html.title(_("Give Vaccination")) + \'">\',\n                tableform.fields_render(window.tailwagCare.fields(\'vaccination\')),\n                tableform.fields_render([\n                    { post_field: "givennewdate", type: "date", label: _("Given"), date_nofuture: true },\n                    { post_field: "givenexpires", type: "date", label: _("Expires"),  \n                        callout: _(\'Optional, the date the vaccination "wears off" and needs to be administered again\') },\n                    { post_field: "givenbatch", type: "text", label: _("Batch Number") },\n                    { post_field: "givenbatchexpiry", type: "date", label: _("Batch Expiry"), \n                        callout: _(\'Optional, the use by date provided by the manufacturer\') },\n                    { post_field: "givenmanufacturer", type: "text", label: _("Manufacturer") },\n                    { post_field: "givencost", type: "currency", label: _("Cost") },\n                    { post_field: "givenrabiestag", type: "text", label: _("Rabies Tag") },\n                    { post_field: "givenby", type: "select", label: _("By"), \n                        options: { displayfield: "USERNAME", valuefield: "USERNAME", rows: controller.users, prepend: \'<option value=""></option>\'}},\n                    { post_field: "givenvet", type: "person", label: _("Administering Vet"), personfilter: "vet" },\n                    { type: "raw", fullrow: true, \n                        markup: \'<p class="asm-header">\' + _("Reschedule") + \n                        \' <span id="callout-rescheduledate" class="asm-callout">\' + \n                        _("Specifying a reschedule date will make copies of the selected vaccinations and mark them to be given on the reschedule date. Example: If this vaccination needs to be given every year, set the reschedule date to be 1 year from today.") + \n                        \'</span></p>\' },\n                    { post_field: "rescheduledate", type: "date", label: _("Reschedule"), date_nopast: true },\n                    { post_field: "reschedulecomments", type: "textarea", label: _("Comments") },\n                    { type: "raw", fullrow: true, rowclasses: "tagstock", \n                        markup: \'<p class="asm-header">\' + _("Stock") + \n                            \' <span id="callout-stock" class="asm-callout">\' + \n                            _("These fields allow you to deduct stock for the vaccination(s) given. This single deduction should cover the selected vaccinations being administered.") + \n                            \'</span></p>\' },\n                    { post_field: "item", type: "select", label: _("Item"), rowclasses: "tagstock", \n                        options: { displayfield: "ITEMNAME", rows: controller.stockitems, prepend: \'<option value="-1">\' + _("(no deduction)") + \'</option>\'} },\n                    { post_field: "quantity", type: "number", label: _("Quantity"), rowclasses: "tagstock" },\n                    { post_field: "usagetype", type: "select", label: _("Usage Type"), rowclasses: "tagstock", \n                        options: { displayfield: "USAGETYPENAME", rows: controller.stockusagetypes}},\n                    { post_field: "usagedate", type: "date", label: _("Usage Date"), rowclasses: "tagstock" },\n                    { post_field: "usagecomments", type: "textarea", label: _("Comments"), rowclasses: "tagstock" }\n                ]),\n                \'</div>\'\n            ].join("\\n");\n        },\n',
)
patch_method(
    "src/static/js/test.js",
    "",
    "bind_givendialog",
    True,
    "12e6fd96aca5d5f9228a1240b7521436676979dec137de81abcc84d8a9e37379",
    "        bind_givendialog: function() {\n            window.tailwagCare.bind('test', () => tableform.table_ids(test.table));\n        },\n",
)
patch_method(
    "src/static/js/test.js",
    "",
    "render_givendialog",
    True,
    "334b72e3be090efbb14338b3283be41de4699a095cbcf80ebc04aeb51d53029d",
    '        render_givendialog: function() {\n            return [\n                \'<div id="dialog-given" style="display: none" title="\' + html.title(_("Perform Test")) + \'">\',\n                tableform.fields_render(window.tailwagCare.fields(\'test\')),\n                tableform.fields_render([\n                    { post_field: "newdate", type: "date", label: _("Performed"), date_nofuture: true },\n                    { post_field: "testresult", type: "select", label: _("Result"), \n                        options: { displayfield: "RESULTNAME", rows: controller.testresults }},\n                    { post_field: "retestdate", type: "date", label: _("Retest"), date_nopast: true },\n                    { post_field: "givencost", type: "currency", label: _("Cost") },\n                    { post_field: "givenvet", type: "person", label: _("Administering Vet"), personfilter: "vet" },\n                    { type: "raw", fullrow: true, rowclasses: "tagstock", \n                        markup: \'<p class="asm-header">\' + _("Stock") + \n                            \' <span id="callout-stock" class="asm-callout">\' + \n                            _("These fields allow you to deduct stock for the test(s) given. This single deduction should cover the selected tests being performed.") + \n                            \'</span></p>\' },\n                    { post_field: "item", type: "select", label: _("Item"), rowclasses: "tagstock", \n                        options: { displayfield: "ITEMNAME", rows: controller.stockitems, prepend: \'<option value="-1">\' + _("(no deduction)") + \'</option>\'} },\n                    { post_field: "quantity", type: "number", label: _("Quantity"), rowclasses: "tagstock" },\n                    { post_field: "usagetype", type: "select", label: _("Usage Type"), rowclasses: "tagstock", \n                        options: { displayfield: "USAGETYPENAME", rows: controller.stockusagetypes}},\n                    { post_field: "usagedate", type: "date", label: _("Usage Date"), rowclasses: "tagstock" },\n                    { post_field: "usagecomments", type: "textarea", label: _("Comments"), rowclasses: "tagstock" }\n                ]),\n                \'</div>\'\n            ].join("\\n");\n        },\n',
)

path = root / "src/static/js/medical.js"
text = path.read_text()
old = '                { id: "undo", text: _("Undo"), icon: "cross", enabled: "multi", perm: "bcam",\n                    tooltip: _("Undo given treatments"),\n                    click: async function() {\n                        await common.ajax_post("medical", "mode=undo&ids=" + medical.selected_treatment_ids());\n                        $.each(controller.rows, function(i, v) {\n                            if (tableform.table_id_selected(v.COMPOSITEID)) {\n                                v.DATEGIVEN = null;\n                                v.GIVENBY = "";\n                                v.TREATMENTCOMMENTS = "";\n                            }\n                        });\n                        tableform.table_update(medical.table);\n                        if (controller.name == "animal_medical") {\n                            common.route_reload();\n                        }\n                    }\n                },\n'
new = '                { id: "undo", text: _("Correct / clear"), icon: "cross", enabled: "multi", perm: "bcam",\n                    tooltip: _("Clear an erroneous completion with an attributed reason"),\n                    click: function() { window.tailwagCare.openUndo(); }\n                },\n'
if new not in text:
    if text.count(old) != 1:
        raise RuntimeError("Care Undo button anchor changed")
    path.write_text(text.replace(old, new))

(root / "src/static/js/tailwag-care.js").write_text(
    (
        pathlib.Path(__file__).resolve().parents[1] / "static/care-workflows.js"
    ).read_text()
)
