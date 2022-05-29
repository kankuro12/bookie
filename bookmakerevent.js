const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');
const axios = require("axios");


class PuppeteerService {


    constructor(loginlink, apiUrl) {
        this.browser = null;
        this.page = null;
        this.pageOptions = null;
        this.waitForFunction = null;
        this.isLinkCrawlTest = null;
        this.loginlink = loginlink;
        this.apiUrl = apiUrl;
        this.pageOptions = {
            waitUntil: 'networkidle2',
            timeout: 300000000
        };
        this.completed=false;
        this.i = 1;
      
    }

    async initBrowser() {

        if (this.browser == null || this.browser == undefined) {
            puppeteerExtra.use(pluginStealth());
            this.browser = await puppeteerExtra.launch({ headless: false });
        }
    }
    getDate(localData) {
        let localDate = localData.gmdt;
        const year = parseInt(localDate / 10000);
        localDate = localDate % 10000;
        const month = parseInt(localDate / 100);
        const day = localDate % 100;
        return year + "-" + (month < 10 ? ("0" + month) : month) + "-" + (day < 10 ? ("0" + day) : day) + " " + localData.gmtm;
    }
    login(username, password) {
        return new Promise(async (resolve, reject) => {
            await this.initBrowser();
            const userAgent = randomUseragent.getRandom();
            const crawlResults = { isValidPage: true, pageSource: null };
            try {
                this.page = await this.browser.newPage();
                await this.page.setRequestInterception(true);
                this.page.on('request', (request) => {
                    if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });

                await this.page.setUserAgent(userAgent);
                await this.page.goto(this.loginlink, this.pageOptions);
                await this.page.type('#account', username);
                await this.page.type('#password', password);
                await this.page.click('.btnCta_light');
                await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
               
                this.page.goto(this.crawllink, this.pageOptions).catch((err)=>{console.log(err);});
                this.page.on("requestfinished", async req => {
                    
                // });
                    if (req.url() == this.apiUrl) {
                        try {
                            const res = req.response();

                            const data = await res.json();
                            const list=data.GameView.game.map((localData)=>{
                                return {
                                    id:localData.idgm,
                                    date:this.getDate(localData),
                                    line:localData.Derivatives.line,

                                }
                            });
                            resolve(list);
                            await this.page.close();
                            // (await this.browser).close();
                            this.completed=true;
                        } catch (error) {
                            reject(error)
                        }
                    }

                // await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

                // await this.browser.close();
                });
            }
            catch (error) {
                console.log(error, "jjjjjjjjjj");
                crawlResults.isValidPage = false;
                reject(error);
            }

        });
    }

    
    makeLink(str) {
        return str.replaceAll(' ', '-');
    }

    async initiate(crawllink) {
        this.crawllink = crawllink;

        return await this.login('BKR760638', 'Sagar@123');
        // return new Promise(async (resolve, reject) => {
        //     resolve( data);

        // });
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
}

const puppeteerService = new PuppeteerService('https://www.bookmaker.eu/', 'https://be.bookmaker.eu/BetslipProxy.aspx/GetGameView');
exports.bookmakerEvent=async (url)=>{
    const localdata= await  puppeteerService.initiate(url);
    return localdata;
};




