import { Context, Schema,h } from 'koishi';
import {} from 'koishi-plugin-puppeteer'
export const name = 'cs2-tools';
export const inject = ['puppeteer','database'];
export interface Config {
    isSendTimes: boolean;
    // KcCounts: number;
}

export const Config: Schema<Config> = Schema.object({
    isSendTimes: Schema.boolean().default(true).description('这个开关用来确认是否向开发者反馈使用情况，自愿开启，可以用于鼓励开发者'),
    // KcCounts : Schema.number().default(20).description('访问的库存件数，请根据机器人网络环境设置，如果库存获取失败，请适当调整此值').max(80).min(20)
});
function calculatePercentageChange(initialValue: number, finalValue: number) {
    if(initialValue == 0) return '0%'
    const change = ((finalValue - initialValue) / initialValue) * 100;
    return change.toFixed(2) + '%'; // 保留两位小数并添加百分号
}

declare module 'koishi' {
    interface Tables {
      cs2buff: cs2_tools
    }
  }
  
  // 这里是新增表的接口类型
  export interface cs2_tools {
    id: string
    cookie: []
    last_value: number
  }

export function apply(ctx: Context,config: Config) {
    async function PostTimedata(command: string,times: number) {
        if(!config.isSendTimes) return
        const url=`https://90008.top/KoiAPI/PluginsUse/${name}/koitime.php`
        // console.log('正在发送数据……')
        const data = {"command":command,"times":times}
        try{
        const request=await ctx.http.post(url, data,{headers: {'Content-Type': 'application/json'}})
        console.log(request)
        }catch(e){
            console.log(e)
        }
        /*
        此函数用于统计用户使用情况，用户自愿开启，不会收集任何隐私信息，本插件全面开源
        */
    }
ctx.model.extend('cs2buff', {
      id: 'string',
      cookie: 'json',
      last_value: 'integer',
    
  });
  ctx.command('绑定账号','绑定Buff账号')
  .action(async ({ session }) => {
    if(session.guildId) return '请与机器人私聊绑定账号'
    session.send('请注意：绑定Buff账号是敏感行为，请在完全信任的机器人下绑定，如果你已知晓，请在10秒内回复“Y”')
    const ensure=await session.prompt(10000)
    if(ensure=='Y'){
        session.send('正在获取登录二维码……')
        const page = await ctx.puppeteer.page()
        await page.goto('https://buff.163.com/')
        const scookies = await page.cookies();
        await page.deleteCookie(...scookies)
        await page.goto('https://buff.163.com', { waitUntil: 'load' });
        
        // session.send('请发送您根据教程获取到的Cookie')
        await page.evaluate(() => {
                //@ts-ignore //忽略ts检查
                loginModule.showLogin(); // 调用页面中的函数
        });
        await page.waitForSelector('.login-qrcode',{visible:true,timeout:3000})
        // const imgElement = await page.$(`#qr_code_box img[style="display: block;"]`);
        // const src =await page.evaluate(el => el.getAttribute('src'), imgElement);
        const imageElement = await page.$('.login-qrcode');
        const src = await imageElement.screenshot({type:'png'});
        session.send(`请在完全信任该机器人的情况下使用Buff手机APP扫描此二维码并勾选“10天内免登录”功能
        ${h.image(src,'image/png')}
        如果二维码过期，请重复绑定操作
        请注意：任何自行扫描二维码导致的账号损失，本插件及其作者概不负责
        如果此界面二维码空白，请再次尝试获取，重新获取二维码，或检查机器人网络环境`)
        // const cookie=await session.prompt(10000)
        await page.waitForSelector('.user-avatar-wrapper.no-border',{visible:true,timeout:60000});
        const cookies = await page.cookies();
        console.log(cookies)
        await ctx.database.upsert('cs2buff',[{id:session.userId,cookie:cookies,last_value:0}])
        await page.close();
        session.send('绑定成功，你可以使用“查看库存”查看是否成功绑定')
        PostTimedata("绑定账号",1)
      }else{
        session.send('已取消绑定')
      }
  }
)
  ctx.command('查看库存','查看Buff库存')
   .option('pages','-p <pages>',{ fallback: 1 })
      .action(async ({ session,options}) => {

        try{
            await session.send('正在等待库存刷新，请稍等……')
        const datas=await ctx.database.get('cs2buff',session.userId)
        const last_value=datas[0].last_value
        const usercookie=datas[0].cookie
        // const Cookies=usercookie.map(cookieStr => JSON.parse(cookieStr))
        // return usercookie
        const page = await ctx.puppeteer.page()
        // const cookies = [
        //     { name: 'session', value: usercookie, domain: 'buff.163.com' },
        // ];
        // console.log(usercookie)
        await page.setCookie(...usercookie)
      const url = `https://buff.163.com/market/steam_inventory?game=csgo#page_num=${options.pages}&page_size=20&search=&sort_by=price.desc&state=all`
      await page.goto(url,{timeout:5000,waitUntil:'load'})
    //   console.log( await page.cookies())
    //if(options.f) await page.reload({waitUntil:'load'})//刷新界面，不知道有没有用
    await page.waitForSelector('#refresh.i_Btn', { visible: true });

    // 点击元素
    await page.click('#refresh.i_Btn');
        // 等待元素文本变回“刷新”
        await page.waitForFunction(
            () => document.querySelector('#refresh.i_Btn').textContent === '刷新',
            { timeout: 10000 } // 可以设置超时时间，例如 10000 毫秒
        );
        await page.goto(url,{waitUntil:'load'})
    await page.waitForSelector('li.my_inventory', { visible: true });
          await page.waitForSelector('img.user-avatar',{visible:true,timeout:5000});
    const imageElement = await page.$('img.user-avatar');
            
    await page.waitForSelector('strong.c_Yellow.f_Normal',{visible:true,timeout:5000})
        // 提取元素的文本内容
        const jianshu = await page.$eval('strong.c_Yellow.f_Normal', el => el.textContent);//获取件数
        const guzhi = (await page.$eval('strong.c_Yellow.f_Normal:nth-of-type(2)', el => el.textContent)).replace(/[^0-9.]/g, '');;//获取估值
        await page.waitForSelector('.list_card.list_card_small2.l_Clearfix',{visible:true});
        await page.waitForFunction(() => document.querySelectorAll('div.list_card.list_card_small2.l_Clearfix ul li').length == 20,{timeout:5000});
        const market_card=await page.$('.list_card.list_card_small2.l_Clearfix');
        const KuCunShot=await market_card.screenshot({type:'png'});
        // const src = await page.evaluate(el => el.getAttribute('src'), imageElement);//获取头像

        await ctx.database.upsert('cs2buff',[{id:session.userId,last_value:Number(guzhi)}])
        session.send(`库存件数：${jianshu}
        估值：￥${guzhi}
        较上一次查询，增加${(Number(guzhi)-last_value).toFixed(2)}元
        涨跌幅度：${calculatePercentageChange(last_value,Number(guzhi))}
        库存: ${h.image(KuCunShot,'image/png')}
        如遇到图片加载不完全的问题，请检查网络环境并多次获取
        你可以在30秒内在此消息下使用“检视 序号”来获取你想在游戏中检视的物品`);//        头像：${h.image(src)}
        // const quotemessage = session.quote.content
        // if(quotemessage) 
        // console.log(quotemessage)
        PostTimedata("查看库存",1)
        const prompt=await session.prompt(30000)
        if(!prompt) return
        const jscz=(prompt).split(' ')
        if(jscz[0]=='检视'){
            const selector = `li:nth-of-type(${jscz[1]}) a.csgo-action-link`;
            if(!(Number(jscz[1])<20)) return '请输入正确的序号'
            // 获取 href 属性
            //@ts-ignore
            const steamLink = await page.$eval(selector, el => el.href);
            await session.send(`请复制以下链接到浏览器打开，并允许打开外部应用
            请确保电脑上安装了Steam以及cs2最新客户端
            `)
            await session.send(steamLink)
            PostTimedata("检视",1)
        }
        await page.close();

    }
    catch(e){
        console.log(e)
        return '获取库存失败，请检查Cookie是否绑定成功或失效,如无法解决，请向开发者反馈以下内容'+e
    }
      });
}