const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');
const axios = require("axios");


class PuppeteerService {


    constructor(loginlink, apiUrl) {
        this.browser = null;
        this.page = null;
        this.loginPage = null;
        this.pageOptions = null;
        this.waitForFunction = null;
        this.isLinkCrawlTest = null;
        this.loginlink = loginlink;
        // this.crawllink = crawllink;
        this.apiUrl = apiUrl;
        this.pageOptions = {
            waitUntil: 'networkidle2',
            timeout: 300000000
        };
        this.i = 1;
    }

    async initBrowser() {

        if (this.browser == null || this.browser == undefined) {
            puppeteerExtra.use(pluginStealth());
            this.browser = await puppeteerExtra.launch({ headless: false });
        }
    }
    login(username, password) {
        return new Promise(async (resolve, reject) => {
            await this.initBrowser();
            const userAgent = randomUseragent.getRandom();
            const crawlResults = { isValidPage: true, pageSource: null };
            try {
                this.loginPage = await this.browser.newPage();
                await this.loginPage.setRequestInterception(true);

                this.loginPage.on('request', (request) => {
                    if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });
                await this.loginPage.setUserAgent(userAgent);
                await this.loginPage.goto(this.loginlink, this.pageOptions);
                await this.loginPage.type('#account', username);
                await this.loginPage.type('#password', password);
                await this.loginPage.click('.btnCta_light');
                await this.loginPage.waitForNavigation();
                try {
                    this.loginPage.on("requestfinished", async req => {
                        if (req.url() == this.apiUrl) {
                            try {
                                const res = req.response();

                                const data = await res.json();
                                const elist = data.Schedule.Data.Leagues.League[0].dateGroup.map((localData) => {
                                    console.log(localData);
                                    const gameData = localData.game[0];
                                    const home = this.makeLink(gameData.htm.toLowerCase());
                                    const away = this.makeLink(gameData.vtm.toLowerCase());
                                    return {
                                        id: gameData.idgm,
                                        url: this.crawllink + away + "-vs-" + home
                                    }
                                });


                                resolve(elist);
                            } catch (error) {
                                reject(error)
                            }
                            console.log("trying for " + (this.i++));
                        }

                    });
                    this.loginPage.goto(this.crawllink, this.pageOptions);
                } catch (err) {
                    console.log(err);

                }
            }
            catch (error) {
                console.log(error);
                crawlResults.isValidPage = false;
                reject(error);
            }

        });
    }

    makeLink(str) {
        return str.replaceAll(' ', '-');
    }

    initiate(crawllink) {
        this.crawllink=crawllink;
        return new Promise(async (resolve, reject) => {
            var data = await this.login('BKR760638', 'Sagar@123');
            resolve( data);

        });
    }
   
    

    generateLink() {

        const apiUrl = `https://be.bookmaker.eu/en/sports/baseball/mlb/major-league-baseball/`;
        return apiUrl;
    }
    parse(url) {
        var splitURL = url.slice(url.lastIndexOf("=") + 1);
        return splitURL;
    };


    loadFirst() {
        const homeUrl = 'https://www.bookmaker.eu/';
    }




    async crawl(link) {
        const userAgent = randomUseragent.getRandom();
        const crawlResults = { isValidPage: true, pageSource: null };
        try {
            await this.page.setUserAgent(userAgent);
            await this.page.goto(link, this.pageOptions);
            await this.page.waitForFunction(this.waitForFunction);
            crawlResults.pageSource = await this.page.content();

        }
        catch (error) {
            console.log(error);
            crawlResults.isValidPage = false;
        }
        if (this.isLinkCrawlTest) {
            this.close();
        }

        return "sagar"
    }

    close() {
        if (!this.browser) {
            this.browser.close();
        }
    }
}

const puppeteerService = new PuppeteerService('https://www.bookmaker.eu/', 'https://be.bookmaker.eu/BetslipProxy.aspx/GetSchedule');
exports.bookmaker=async (url)=>{
   const localdata= await  puppeteerService.initiate();
   return localdata;
};

