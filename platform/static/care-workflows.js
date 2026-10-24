/* Shared native care dialogs; canonical records remain in ASM. */
window.tailwagCare = {
  nextAction: "record",
  fields(kind) {
    let options =
      '<option value="record">Record completion</option><option value="correct">Correct completed record</option>';
    if (kind === "medical")
      options += '<option value="undo">Clear erroneous completion</option>';
    return [
      { post_field: "recordaction", type: "select", label: "Action", options },
      {
        post_field: "correctionreason",
        type: "textarea",
        label: "Correction reason",
        callout:
          "Required for corrections. Clearing assigns you a care-plan review task; it does not restart treatment or put supplies back into stock.",
      },
      {
        type: "raw",
        fullrow: true,
        markup: '<p id="tw-care-error" role="alert" tabindex="-1"></p>',
      },
    ];
  },
  openUndo() {
    this.nextAction = "undo";
    $("#dialog-given").dialog("open");
  },
  bind(kind, idsGetter) {
    const dialog = $("#dialog-given");
    const dateField = kind === "vaccination" ? "givennewdate" : "newdate";
    $(window)
      .off("resize.tailwagCare")
      .on("resize.tailwagCare", () => {
        if (dialog.hasClass("ui-dialog-content")) {
          dialog.dialog("option", {
            width: Math.min(550, window.innerWidth - 24),
            maxHeight: window.innerHeight - 24,
          });
        }
      });
    const update = () => {
      const action = $("#recordaction").val();
      const correction = action !== "record";
      $("#correctionreason").closest("tr").toggle(correction);
      dialog.find(".tagstock").toggle(!correction);
      for (const id of [
        dateField,
        "newtime",
        "givenby",
        "givenvet",
        "treatmentcomments",
      ]) {
        $("#" + id)
          .closest("tr")
          .toggle(action !== "undo");
      }
      for (const id of ["rescheduledate", "reschedulecomments", "retestdate"]) {
        $("#" + id)
          .closest("tr")
          .toggle(!correction);
        if (correction) $("#" + id).val("");
      }
      if (correction) $("#item").val("-1");
    };
    $("#recordaction").on("change", () => {
      if ($("#recordaction").val() === "correct") {
        const selected = new Set(String(idsGetter()).split(","));
        const rows = controller.rows.filter((row) =>
          selected.has(String(kind === "medical" ? row.TREATMENTID : row.ID)),
        );
        const row = rows.length === 1 ? rows[0] : null;
        const field =
          kind === "medical"
            ? "DATEGIVEN"
            : kind === "vaccination"
              ? "DATEOFVACCINATION"
              : "DATEOFTEST";
        $("#" + dateField).val(row ? format.date(row[field]) : "");
        if (kind === "medical") {
          $("#newtime").val(row ? format.time(row[field]) : "");
          $("#treatmentcomments").val(row ? row.TREATMENTCOMMENTS || "" : "");
        }
        if (row && kind === "test") $("#testresult").val(row.TESTRESULTID);
        if (row && row.GIVENBY) $("#givenby").val(row.GIVENBY);
        if (row) {
          if (row.ADMINISTERINGVETID)
            $("#givenvet").personchooser("loadbyid", row.ADMINISTERINGVETID);
          else $("#givenvet").personchooser("clear");
          if (kind !== "medical")
            $("#givencost").currency("value", row.COST || 0);
          if (kind === "vaccination") {
            $("#givenexpires").val(format.date(row.DATEEXPIRES));
            $("#givenbatch").val(row.BATCHNUMBER || "");
            $("#givenbatchexpiry").val(format.date(row.BATCHEXPIRYDATE));
            $("#givenmanufacturer").val(row.MANUFACTURER || "");
            $("#givenrabiestag").val(row.RABIESTAG || "");
          }
        }
      }
      update();
    });
    $("#item").on("change", function () {
      const item = common.get_row(controller.stockitems, $(this).val(), "ID");
      if (!item) return;
      if (kind === "vaccination") {
        $("#givenbatch").val(item.BATCHNUMBER || "");
        $("#givenbatchexpiry").val(format.date(item.EXPIRY));
      }
      if (kind !== "medical")
        $("#givencost").currency("value", item.UNITPRICE || 0);
    });
    dialog.dialog({
      autoOpen: false,
      width: Math.min(550, window.innerWidth - 24),
      maxHeight: window.innerHeight - 24,
      modal: true,
      dialogClass: "dialogshadow",
      title: "Save care record",
      open: () => {
        dialog.dialog("option", {
          width: Math.min(550, window.innerWidth - 24),
          maxHeight: window.innerHeight - 24,
        });
        $("#recordaction").val(this.nextAction);
        this.nextAction = "record";
        $("#correctionreason, #tw-care-error").val("").text("");
        $("#item").val("-1");
        update();
      },
      buttons: [
        {
          text: "Save care record",
          class: "asm-dialog-actionbutton",
          click: async () => {
            validate.reset();
            const action = $("#recordaction").val();
            if (action !== "undo" && !validate.notblank([dateField])) return;
            if (action !== "record" && !validate.notblank(["correctionreason"]))
              return;
            const ids = String(idsGetter());
            const selected = new Set(ids.split(","));
            const versions = {};
            for (const row of controller.rows) {
              const id = kind === "medical" ? row.TREATMENTID : row.ID;
              if (selected.has(String(id)))
                versions[id] = row.CAREVERSION || "";
            }
            $("#usagedate").val($("#" + dateField).val());
            dialog.disable_dialog_buttons();
            try {
              const mode = kind === "test" ? "perform" : "given";
              await common.ajax_post(
                kind,
                dialog.find(".asm-field").toPOST() +
                  "&mode=" +
                  mode +
                  "&ids=" +
                  encodeURIComponent(ids) +
                  "&recordversions=" +
                  encodeURIComponent(JSON.stringify(versions)),
              );
              dialog.dialog("close");
              common.route_reload();
            } catch (error) {
              $("#tw-care-error")
                .text(
                  String(
                    error ||
                      "Save could not be confirmed. Review the record before retrying.",
                  ),
                )
                .trigger("focus");
            } finally {
              dialog.enable_dialog_buttons();
            }
          },
        },
        { text: "Cancel", click: () => dialog.dialog("close") },
      ],
    });
  },
};
