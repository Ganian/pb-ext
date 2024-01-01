"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuGeneralSettings = exports.getStateData = void 0;
const getStateData = async (stateManager) => {
    const domain = await stateManager.retrieve("domain")
        || "https://manatoki111.net";
    return { domain };
};
exports.getStateData = getStateData;
const sectionGeneral = (stateManager) => createSection({
    id: "section_general",
    rows: () => (0, exports.getStateData)(stateManager).then(async (values) => [
        createInputField({
            id: "domain",
            label: "도메인",
            value: values.domain,
            maskInput: false,
            placeholder: "",
        }),
    ]),
});
const formGeneralSettings = (stateManager) => createForm({
    onSubmit: (data) => 
    //@ts-ignore
    Promise.all(Object.keys(data).map((key) => stateManager.store(key, data[key]))).then(),
    validate: () => Promise.resolve(true),
    sections: () => Promise.resolve([sectionGeneral(stateManager)]),
});
const menuGeneralSettings = (stateManager) => createNavigationButton({
    id: "btn_settings_general",
    value: "",
    label: "설정",
    form: formGeneralSettings(stateManager),
});
exports.menuGeneralSettings = menuGeneralSettings;
//# sourceMappingURL=TokiSettings.js.map