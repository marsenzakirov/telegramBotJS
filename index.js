require('dotenv').config()
const TelegramAPI = require("node-telegram-bot-api") 
const command = require("nodemon/lib/config/command")
const {MongoClient} = require("mongodb")
const cron = require('node-cron');
let shell = require('shelljs')

const client = new MongoClient(process.env.MONO_DB_CLIENT)
const token = process.env.TOKEN_FOR_TELEGRAMM
const bot = new TelegramAPI(token, {polling: true})



const start = async () => {
    try {
        await client.connect()
        console.log("connected")
    }
    catch(Err) {
        console.log(Err)
    }

    bot.setMyCommands ([
        {command: "/entry", description: "Запись в очередь"},
        {command: "/cancell", description: "Отмена записи в очередь"},
        {command: "/check", description: "Просмотр очереди"},
        {command: "/clear", description: "очистка списка (Для админов)"},
        {command: "/passed", description: "Подтверждение сдачи лабороторных"}
    ]) 
    bot.on("message", async msg => {
        const Users = client.db().collection('Users')

        const text = msg.text
        const chatId = msg.chat.id
        const userId = msg.from.id
        userMSG = msg.from.username

        if (typeof msg.from.last_name != "undefined" && typeof msg.from.first_name != "undefined") {
            userName =  msg.from.first_name +  msg.from.last_name
        }
        else if (typeof msg.from.last_name == "undefined") {
            userName =  msg.from.first_name
        }
        else if (typeof msg.from.first_name == "undefined") {
            userName =  msg.from.last_name
        }
        else {
            userName = "noName"
        }
        user = await Users.findOne({id: `${userId}`})
        if (!user) {
            await Users.insertOne({
                name: `${userName}`,
                id: `${userId}`,
                userNameTelegram: `${userMSG}`,
                admin: "false",
                GLAdmin: "false",
                entry: "false",
                owner: "false",
                passed: "false"
            })
        }
        user = await Users.findOne({id: `${userId}`})
        if (text == "/entry" || text == "/entry@writeToTheQueueBot") {
            if(user.entry == "false") {
                const entryListUsers = await Users.find(({entry: "true"})).toArray()
                Users.updateOne(
                    {id: `${userId}`},
                    {
                        $set: {
                            entry: "true"
                        }
                    }
                )

                lenEntry = 1;
                checkEntry = "Список записавшихся:\n"

                for (let i = 0; i < entryListUsers.length; i++) {
                    lenEntry++
                }

                return bot.sendMessage(chatId,`Вы успешно записались в очередь, ваше место - ${lenEntry}`)
            }
            else {
                return bot.sendMessage(chatId,`Вы уже записались в очередь, чтобы повторно записаться, отмените предыдущую запись с помощью команды "/cancell"`)  
            }
        }
        if (text == "/help" || text == "/help@writeToTheQueueBot") {
            
            if (user.admin == "true" || user.GLAdmin == "true") {
                return bot.sendMessage(chatId,`список команд:\n1) /entry - добавиться в очередь\n2) /cancell - выйти из очереди\n3) /check - посмотреть очеред\n4) /passed -Подтверждение сдачи лабороторных \n 5) clear - очистка списка `)
            }
            else {
                return bot.sendMessage(chatId,`список команд:\n1) /entry - добавиться в очередь\n2) /cancell - выйти из очереди\n3) /check - посмотреть очеред\n4) /passed -Подтверждение сдачи лабороторных \n `)
            }
        }
        if (text == "/check" || text == "/check@writeToTheQueueBot") {
            try {
            const entryListUsers = await Users.find(({entry: "true"})).toArray()
            c = 1;
            checkEntry = "Список записавшихся:\n"
            for (let i = 0; i < entryListUsers.length; i++) {
                if (entryListUsers[i].passed == "true") {
                    checkEntry += c + ") " + entryListUsers[i].name + " ✅\n"
                }
                else {
                    checkEntry += c + ") " + entryListUsers[i].name + "\n"
                }
                c++
            }
            return bot.sendMessage(chatId,`${checkEntry}`)
            }
            catch {
                return bot.sendMessage(chatId,`список пуст`)
            }

        }
        if (text == "/cancell" || text == "/cancell@writeToTheQueueBot") {
            if (user.entry == "true") {
                Users.updateOne(
                    {id: `${userId}`},
                    {
                        $set: {
                            entry: "false"
                        }
                    }
                )
                return bot.sendMessage(chatId, "Вы успешно вышли из очереди")
            }
            else {
                return bot.sendMessage(chatId, "Вас нет в очереди")
            }
        }
        if (text.substring(0,9) == "/addAdmin") {
            if (user.owner == "true" || user.admin == "true" || user.GLAdmin == "true") {
                nameAdmin = text.substring(10)
                if (nameAdmin[0] == "@") {
                    Users.updateOne(
                        {userNameTelegram: `${text.substring(11)}`},
                        {
                            $set: {
                                admin: "true"
                            }
                        }
                    )
                    return bot.sendMessage(chatId, "Вы успешно добавили нового администратора")
                }
                else {
                    return bot.sendMessage(chatId, "Вы ввели неверное имя пользовтеля")
                }
            }
            else {
                return bot.sendMessage(chatId, "У вас нет прав доступа к этой команде")
            }
        }
        if (text.substring(0,11) == "/addGLAdmin") {
            if (user.owner == "true") {
                nameGLAdmin = text.substring(12)
                if (nameGLAdmin[0] == "@") {
                    Users.updateOne(
                        {userNameTelegram: `${text.substring(13)}`},
                        {
                            $set: {
                                GLadmin: "true"
                            }
                        }
                    )
                    return bot.sendMessage(chatId, "Вы успешно добавили нового главного администратора")
                }
                else {
                    return bot.sendMessage(chatId, "Вы ввели неверное имя пользовтеля")
                }
            }
            else {
                return bot.sendMessage(chatId, "У вас нет прав доступа к этой команде")
            }
        }
        if (text == "/clear" || text == "/clear@writeToTheQueueBot") {
            if (user.owner == "true" || user.admin == "true" || user.GLAdmin == "true"){
                Users.updateMany(
                    {entry: "true"},
                    {
                        $set: {
                            entry: "false",
                            passed: "false"
                        }
                    }
                )
                return bot.sendMessage(chatId, "Список обновлен")
            }
            else {
                return bot.sendMessage(chatId, "У вас нет доступа к этой команде") 
            }
        }
        if (text.substring(0,12) == "/deleteAdmin") {
            if (user.owner == "true" || user.GLAdmin == "true") {
                nameAdmin = text.substring(14)
                userAdmin = Users.findOne({userNameTelegram: `${nameAdmin}`})
                if (!userAdmin) {
                    if (userAdmin.admin == "true") {
                        Users.updateOne(
                            {userNameTelegram: `${nameAdmin}`},
                            {
                                $set: {
                                    admin: "false"
                                }
                            }
                        )
                        return bot.sendMessage(chatId, "Пользователь был снят с должности администратор") 
                    }
                    else {
                        return bot.sendMessage(chatId, "Пользователь не является администратором") 
                    }
                }
                else {
                    return bot.sendMessage(chatId, "Пользователь не найден") 
                }
            }
            else {
                return bot.sendMessage(chatId, "У вас нет прав доступа к этой команде") 
            }
        }
        if (text == "/passed" || text == "/passed@writeToTheQueueBot") {
            if (user.passed == "false") {
                if (user.entry == "true") {
                    Users.updateMany (
                        {id: `${userId}`},
                        {
                            $set: {
                                passed: "true"
                            }
                        }
                    )
                    return bot.sendMessage(chatId, "Поздравляю со сдачей") 
                }
                else {
                    return bot.sendMessage(chatId, `Вы еще не записались, чтобы записаться введите "/entry"`) 
                }    
            }
            else {
                return bot.sendMessage(chatId, "Вы уже сдали") 
            }
        }
        
        if (text == "/noPassed" || text == "/noPassed@writeToTheQueueBot") {
            if (user.passed = "true") {
                Users.updateMany (
                    {id: `${userId}`},
                    {
                        $set: {
                            passed: "false"
                        }
                    }
                )
                return bot.sendMessage(chatId, "Вы успешно отменили") 
            }
            else {
                return bot.sendMessage(chatId, "ты Дурачек?") 
            }
        }
        if (text == "/ChatID") {
            myChat = chatId
            return bot.sendMessage(chatId, `${chatId}`) 
        }
    })    
    cron.schedule('* 10 12 * * */2', async () => {
        Users.updateMany(
            {entry: "true"},
            {
                $set: {
                    entry: "false",
                    passed: "false"
                }
            }
        )
        await bot.sendMessage(-514046902, "Обновление списка, можете снова записаться")   
    });
}

start()
