"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const paperback_extensions_common_1 = require("paperback-extensions-common");
const NewToki_1 = require("./NewToki");
const cheerio_1 = __importDefault(require("cheerio"));
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("NewToki Tests", function () {
    this.timeout(15000);
    const wrapper = new paperback_extensions_common_1.APIWrapper();
    const source = new NewToki_1.NewToki(cheerio_1.default);
    const mangaId = "468278";
    it("Search Manga Title", async () => {
        const testSearch = { title: "하루만" };
        const search = await wrapper.searchRequest(source, testSearch);
        for (const result of search.results) {
            chai.expect(result, "No response from server").to.exist;
            const res = result;
            chai.expect(res.id, "No ID found for search query").to.be.not.empty;
            chai.expect(res.image, "No image found for search").to.be.not.empty;
            chai.expect(res.title, "No title").to.be.not.null;
            chai.expect(res.subtitleText, "No subtitle text").to.be.not.null;
            chai.expect(res.primaryText, "No primary text").to.be.not.null;
            chai.expect(res.secondaryText, "No secondary text").to.be.not.null;
        }
    });
    //   it("Search Manga Genre", async () => {
    //     const testSearch: SearchRequest = {
    //       includedTags: [
    //         {
    //           id: "19",
    //           label: "Romance",
    //         },
    //       ],
    //     };
    //     const search = await wrapper.searchRequest(source, testSearch);
    //     for (const result of search.results) {
    //       chai.expect(result, "No response from server").to.exist;
    //       const res = <MangaTile> result;
    //       chai.expect(res.id, "No ID found for search query").to.be.not.empty;
    //       chai.expect(res.image, "No image found for search").to.be.not.empty;
    //       chai.expect(res.title, "No title").to.be.not.null;
    //       chai.expect(res.subtitleText, "No subtitle text").to.be.not.null;
    //       chai.expect(res.primaryText, "No primary text").to.be.not.null;
    //       chai.expect(res.secondaryText, "No secondary text").to.be.not.null;
    //     }
    //   });
    // it("Retrieve Manga Details", async () => {
    //   const data = await wrapper.getMangaDetails(source, mangaId);
    //   chai.expect(data.id, "Missing ID").to.be.not.empty;
    //   chai.expect(data.image, "Missing Image").to.be.not.empty;
    //   chai.expect(data.titles, "Missing Titles").to.be.not.empty;
    // });
    // it("Get Chapters", async () => {
    //   const data = await wrapper.getChapters(source, mangaId);
    //   chai.expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;
    // });
    // it("Get Chapter Details", async () => {
    //   const chapters = await wrapper.getChapters(source, mangaId);
    //   const data = await wrapper.getChapterDetails(source, mangaId, chapters[0].id);
    //   chai.expect(data, "No server response").to.exist;
    //   chai.expect(data, "Empty server response").to.not.be.empty;
    //   chai.expect(data.id, "Missing ID").to.be.not.empty;
    //   chai.expect(data.mangaId, "Missing hentaiId").to.be.not.empty;
    //   chai.expect(data.pages, "No pages present").to.be.not.empty;
    // });
    // it("Get Tags", async () => {
    //   const data = await wrapper.getTags(source);
    //   const cats = <TagSection> (<TagSection[]> data)[0];
    //   chai.expect(cats, "No server response").to.exist;
    //   chai.expect(cats.tags, "Empty server repsones").to.not.be.empty;
    // });
});
//# sourceMappingURL=NewToki.spec.js.map