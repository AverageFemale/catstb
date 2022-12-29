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
  const channels = ['je_remy_']
  const prefix = "!"
  const whoEnteredToday = []
  const spaces = "       |       "
  const queue = []
  const current = []
  //const queue = [{user: "dad1", username: "daddy1"}]
  //const current = [{user: "dad", username: "daddy"},{user: "dad", username: "daddy"},{user: "dad", username: "daddy"},{user: "dad", username: "daddy"},{user: "dad", username: "daddy"}]
	const chatClient = new ChatClient({ authProvider, channels: channels });
  const apiClient = new ApiClient({authProvider})
  let jeremy = await apiClient.users.getUserByName("je_remy_")
  chatClient.onConnect(() => {console.log(`Connected to: ${channels.join(", ")}.`)})
  const wsListener = new EventSubWsListener({ apiClient })
  await wsListener.start()
  const offlineListener = wsListener.subscribeToStreamOfflineEvents(jeremy.id, () => {
    whoEnteredToday.splice(0,whoEnteredToday.length)
    console.log("STREAM OFFLINE!")
  })
  
	chatClient.onMessage(async (channel, user, text, msg) => {
    if (!text.startsWith(prefix)) return
    let channelOwner = await apiClient.users.getUserByName(channel.split("#")[1])
    let hasPower = msg.userInfo.isMod || msg.userInfo.isBroadcaster || user.toLowerCase() == "averagefemale_"
    user = msg.userInfo
    const command = text.split(prefix)[1].split(" ").shift()
    const args = text.split(" ").slice(1)
		switch(command) {
      case "dono":
        let isInQueue = false
        let queueIndex = null
        queue.forEach((v,i) => {if (v.user == user.userName) {isInQueue = true; queueIndex = i}})
        if (!args[0]) return chatClient.say(channel,`@${user.userName}, you need to input your username to enter the queue.`)
        if (args[0].length > 20) return chatClient.say(channel, `@${user.userName}, this name is over the 20 character limit.`) 
        if (isInQueue) {
          queue[queueIndex].username = args[0].toLowerCase()
          return chatClient.say(channel,`@${user.userName}, changed your queued username to: ${args[0]}.`)
        }
        if (whoEnteredToday.includes(user.userName)) return chatClient.say(channel, `@${user.userName}, you've already been donated to today.`)
        
  			chatClient.say(channel,`@${user.userName}, you've been added to the queue.`)
        queue.push({user: user.userName, username: args[0].toLowerCase()})
        whoEnteredToday.push(user.userName)
      break;
      case "next":
        current.splice(0,current.length)
        if (!hasPower) return chatClient.say(channel, `$@{user.userName}, you don't have permission to use this command.`) 
        if (queue.length == 0) return chatClient.say(channel,`@${user.userName}, there is no one in the queue.`)
        let messageNext = ""
        for (let i = 0; i < 5; i++) {
          if (queue[0]) {
            messageNext = messageNext + `@${queue[0].user}: ${queue[0].username}${queue[1] ? spaces : `${spaces}If you wanna join then do !dono then your username! Example: !dono je_remy_`}`
            current.push(queue[0])
            queue.splice(0,1)
          }
        }
        chatClient.say(channel,messageNext)
      break;
      case "current":
        if (!hasPower) return chatClient.say(channel,`@${user.userName}, you don't have permission to use this command.`)
        if (current.length == 0) return chatClient.say(channel,`@${user.userName}, no one is currently being donated to, run !next to get people.`)
        let messageCurrent = ""
        for (let i = 0; i < current.length; i++) {
          if (current[i]) {
            messageCurrent = messageCurrent + `@${current[i].user}: ${current[i].username}${current[i + 1] ? spaces : `${spaces}If you wanna join then do !dono then your username! Example: !dono je_remy_`}`
          }
        }
        chatClient.say(channel,messageCurrent)
      break;
      case "cmds":
        chatClient.say(channel,`@${user.userName} | !dono <username> - Enters you into the queue. | !next - Presents the next set of people in the queue. | !current - Presents the current people that are being donated to. | Created by @AverageFemale_`)
      break;
      case "reset":
        if (user.userName.toLowerCase() !== "averagefemale_") return;
        whoEnteredToday.splice(0,whoEnteredToday.length)
        chatClient.say(channel,`@${user.userName}, reset the cache.`)
      break;
    }
    
	});
  await chatClient.connect();
}

main();