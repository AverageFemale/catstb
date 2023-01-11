import { StaticAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api'
import { EventSubWsListener } from '@twurple/eventsub-ws'
import * as dotenv from 'dotenv'
dotenv.config()
//import { promises as fs } from 'fs';

async function main() {
	const clientId = process.env['id'];
  const accessToken = process.env['token']
	const authProvider = new StaticAuthProvider(clientId,accessToken)
  const channels = ['sorryaboutyourcats']
  const prefix = "!"
  const shortcuts = new Map() // {actions: ["!superspeed","!vanish"]}
	const chatClient = new ChatClient({ authProvider, channels: channels });
  const apiClient = new ApiClient({authProvider})
  chatClient.onConnect(() => {console.log(`Connected to: ${channels.join(", ")}.`)})

  shortcuts.set("averagecombo", {actions: ["!rainbow","!minimize","!speed","!vanish","!warp"]})
  shortcuts.set("averagecomboss", {actions: ["!rainbow","!minimize","!superspeed","!vanish","!warp"]})
  
	chatClient.onMessage(async (channel, user, text, msg) => {
    if (user.toLowerCase() != "averagefemale_") return
    if (!text.startsWith(prefix)) return
    let channelOwner = await apiClient.users.getUserByName(channel.split("#")[1])
    const hasPower = msg.userInfo.isMod || msg.userInfo.isBroadcaster || user.toLowerCase() == "averagefemale_"
    user = msg.userInfo
    const command = text.split(prefix)[1].split(" ").shift()
    const args = text.split(" ").slice(1)
		switch(command) {
      case "eval":
        const random = Math.random()
        try {
          const results = eval(args.join(" "))
          console.log(results)
          chatClient.say(channel,`Success! ${random > 0.1 ? "Kappa" : "KappaPride"}`)
        } catch (e) {
          console.error(e)
          chatClient.say(channel,`Error! ${random > 0.1 ? "FallCry" : "WutFace"}`)
        }
      break;
      case "execute":
        if (args.length > 0) args[0] = args[0].toLowerCase() 
        //chatClient.say(channel,`${user.displayName}, success message.`)
        if (!args[0] || !shortcuts.has(args[0])) return
        var data = shortcuts.get(args[0])
        if (data.actions.length == 0) return 
        data.actions.forEach((v,i) => {
          chatClient.say(channel,v)
        })
      break;
      case "addaction":
        if (args.length > 0) args[0] = args[0].toLowerCase() 
        if (!shortcuts.get(args[0])) shortcuts.set(args[0],{actions: []})
        data = shortcuts.get(args[0])
        let done = false
        const message = []
        args.forEach((v,i) => {
          if (message.length == 0) {
            if (!v.startsWith('"')) return
            if (v.endsWith('"')) done = true;
            message.push(v.replace(/"/gi,""))
          } else {
            if (done) return
            if (!v.endsWith('"')) return message.push(v)
            message.push(v.replace(/"/gi,""))
            done = true
          }
        })
        data.actions.push(message.join(" "))
        shortcuts.set(args[0],data)
        chatClient.say(channel,`${user.displayName}, ${args[0]} was given a new action. "${message}"`)
        
      break;
      case "deleteshortcut":
        if (args.length > 0) args[0] = args[0].toLowerCase() 
        if (!shortcuts.get(args[0])) return chatClient.say(channel,`${user.displayName}, ${args[0]} is not a shortcut.`)
        shortcuts.delete(args[0])
        chatClient.say(channel,`${user.displayName}, ${args[0]} was deleted.`)
      break;
      
    }
    
	});
  await chatClient.connect();
}

main();