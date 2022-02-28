const TelegramAPI = require("node-telegram-bot-api") 
const command = require("nodemon/lib/config/command")
const token = "5201253455:AAGlAjJtLgUHVdfzZuq30TWHFdknjcvi8Aw"
const bot = new TelegramAPI(token, {polling: true})

const start = () => {
    bot.setMyCommands ([
        {command: "/entry", description: "Запись в очередь"},
        {command: "/cancell", description: "Отмена записи в очередь"},
        {command: "/check", description: "Просмотр очереди"},
        {command: "/delete", description: "удалить человека из очереди {/delete @....}"}
    ]) 
    arrayQueue = []
    arrayQueueID = []
    arrayAdmin = ["N77778465053"]
    arrayOwnerID = [884350908]
    arrayGLAdmin = ["N77778465053"]
    counter = 0
    count = 0

    bot.on("message", msg => {
        const text = msg.text
        const chatId = msg.chat.id
        const userId = msg.from.id
        userMSG = msg.from.username
        var days = [
            'Воскресенье',
            'Понедельник',
            'Вторник',
            'Среда',
            'Четверг',
            'Пятница',
            'Суббота'
          ];
        var d = new Date();
        var n = d.getDay();
        var h = d.getHours()
        
        if (days[n] == "Вторник" && count == 0) {
            arrayQueue = []
            arrayQueueID = []
            count = 1
        }
        if (days[n] == "Средра") {
            count = 0
        }
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
    
        if (text == "/entry" || text == "/entry@writeToTheQueueBot") {
            flag = 0
            for (let i = 0; i < arrayQueue.length; i ++) {
                if (userName == arrayQueue[i]) {
                    flag = 1
                }
            }
            if (flag == 1) {
                return bot.sendMessage(chatId,`Вы уже записались в очередь, чтобы повторно записаться, отмените предыдущую запись с помощью команды "/cancell"`)  
            }
            else {
                counter++
                arrayQueue.push(userName);
                arrayQueueID.push(userId)
                return bot.sendMessage(chatId,`Вы успешно записались в очередь, ваше место - ${counter}`)
            }
        }
        if (text == "/help" || text == "/help@writeToTheQueueBot") {
            
            if (testAdmin(userMSG)) {
                return bot.sendMessage(chatId,`список команд:\n1) /entry - добавиться в очередь\n2) /cancell - выйти из очереди\n3) /check - посмотреть очеред\n4) /delete 1/2/3/4(или имя пользователя). - удаляет из очереди пользователья`)
            }
            else {
                return bot.sendMessage(chatId,`список команд:\n1) /entry - добавиться в очередь\n2) /cancell - выйти из очереди\n3) /check - посмотреть очередь`)
            }
        }
        if (text == "/check" || text == "check@writeToTheQueueBot") {
            listOfStudent = ""
            counterStudent = 1
            for(let i = 0; i < arrayQueue.length; i++) {
                listOfStudent+= counterStudent + ") " + arrayQueue[i] + "\n"
                counterStudent++
            }
            return bot.sendMessage(chatId,`список записавшихся:\n${listOfStudent}`)
        }
        if (text == "/cancell" || "/cancell@writeToTheQueueBot") {
            flag = 0
            for (let i = 0; i< arrayQueue.length; i++) {
                if (userName == arrayQueue[i]) {
                    indexImposter = i;
                    arrayQueue.splice(i,1)
                    bot.sendMessage(chatId, "Вы успешно удалили себя из очереди")
                    flag = 1
                    counter -=1
                    break
                }
            }
            if (flag = 0) {
                return bot.sendMessage(chatId, "Вас нет в очереди")
            }
            else {
                for (indexImposter; indexImposter < arrayQueue.length - 1; indexImposter++) {
                    bot.sendMessage(arrayQueueID[indexImposter + 1], `${userName} Вышел из очереди и вы сдвинулись на ${indexImposter} место`)
                }
            }
            return 0;
        }
        if (text.substring(0,9) == "/addAdmin") {
            console.log(testGLAdmin(userMSG))
            console.log(userMSG)
            console.log(arrayGLAdmin)
            if (userId == 884350908 || testGLAdmin(userMSG)) {
                nameAdmin = text.substring(10)
                if (nameAdmin[0] == "@") {
                    arrayAdmin.push(text.substring(11))
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
            if (userId == 884350908) {
                nameGLAdmin = text.substring(12)
                if (nameGLAdmin[0] == "@") {
                    arrayGLAdmin.push(text.substring(13))
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
            if (testAdmin(userMSG) || testGLAdmin(userMSG)){
                arrayQueue = []
                arrayQueueID = []
                counter = 0
                return bot.sendMessage(chatId, "Список обновлен")
            }
        }
        if (text.substring(0,12) == "/deleteAdmin") {
            if (testGLAdmin(userMSG)) {
                nameAdmin = text.substring(14)
                flag = 0;
                for (let i = 0; i < arrayAdmin.length; i++) {
                    if (nameAdmin == arrayAdmin[i]) {
                        arrayAdmin.splice(i,1)
                        flag = 1;
                        return bot.sendMessage(chatId, "Вы успешно сняли пользоватлея с должности адмнистратор")
                    }
                }
                if (flag == 0) {
                    return bot.sendMessage(chatId, "Не удалось найти пользователя")
                }
            }
            else {
                return bot.sendMessage(chatId, "У вас нет прав доступа к этой команде") 
            }
        }
        if(text.substring(0,7) == "/delete") {
            if (testAdmin(userMSG) || testGLAdmin(userMSG)) {
                nameUser = text.substring(8)
                console.log(typeof(nameUser))
                flag = 0
                if (isNaN(nameUser)) {
                    for (let i = 0; i < arrayQueue.length; i++) {
                        if (nameUser == arrayQueue[i]) {
                            arrayQueue.splice(i,1)
                            flag = 1
                            break
                        }
                    }
                    if (flag == 0) {
                        return bot.sendMessage(chatId, "пользователь не найден")
                    }
                    else {
                        counter-=1
                        return bot.sendMessage(chatId, "Пользователь был исключен из очереди")
                        
                    }
                }
                if (!isNaN(nameUser)) {
                    if (nameUser <= counter && nameUser >=1) {
                        arrayQueue.splice(nameUser-1,1)
                        counter-=1
                        return bot.sendMessage(chatId, "Пользователь был исключен из очереди")
                        
                    }
                    else {
                        return bot.sendMessage(chatId, "пользователь не найден")
                    }
                }
            }
            else {
                return bot.sendMessage(chatId, "У вас нет прав доступа к этой команде")
            }
        }
    })
    function testAdmin (nameUser) {
        for(let i = 0; i < arrayAdmin.length; i++) {
            if (nameUser == arrayAdmin[i]) {
                return true
            }
        }
        return false
    }
    function testGLAdmin (nameUser) {
        for(let i = 0; i < arrayGLAdmin.length; i++) {
            if (nameUser == arrayGLAdmin[i]) {
                return true
            }
        }
        return false
    }
}

start()
