"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuGeneralSettings = exports.getStateData = void 0;
class HomeSection {
}
HomeSection.IDs = [
    {
        id: "일반웹툰",
        default: true,
    },
    {
        id: "성인웹툰",
        default: false,
    },
    {
        id: "BL/GL",
        default: false,
    },
];
HomeSection.getIDs = () => HomeSection.IDs.map((id) => id.id);
HomeSection.getDefaults = () => HomeSection.IDs.filter((id) => id.default);
const getStateData = async (stateManager) => {
    const domain = await stateManager.retrieve("domain")
        || "https://newtoki111.com";
    const homeSections = await stateManager.retrieve("homeSections")
        || HomeSection.getDefaults();
    return {
        domain,
        homeSections,
    };
};
exports.getStateData = getStateData;
const sectionGeneral = (stateManager) => createSection({
    id: "section_general",
    rows: () => (0, exports.getStateData)(stateManager).then(async (values) => [
        createSelect({
            id: "homeSections",
            label: "활성 홈 섹션",
            options: HomeSection.getIDs(),
            displayLabel: (id) => id,
            value: values.homeSections,
            allowsMultiselect: true,
        }),
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
    onSubmit: (data) => Promise.all(Object.keys(data).map((key) => stateManager.store(key, data[key]))).then(),
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
//# sourceMappingURL=NewTokiSettings.js.map