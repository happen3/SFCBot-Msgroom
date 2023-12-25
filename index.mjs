import Client from "msgroom";
import child from "child_process";
import randomstring from "randomstring";

import { uptime } from 'os';
import { createHash } from 'crypto';

import { promises as fsPromises } from 'fs';

import { Random } from "random-js";
const RANDOM_GEN = new Random(); // uses the nativeMath engine

import * as mathjs from 'mathjs';
import { format } from "path";

const DEVMODE = false;
const PRODUCTION = true;
const SAFEMODE = false;
//const UPGRADE_MODE = true;

const databasePath = 'database.json';

let elevatedUsers = ["M2AS23CJ1GZZ1IAFZ96ZZ17HH8787Z42"];
let votesYes = 0;
let votesNo = 0;
let isAvoterunning = false;

const PERMABANNED = ["H13IAIADSZ9687ZIA1FZ4287HJ422J7G"];

const NEG_MAX_INT = -(2 ** 31)
const MAX_INT = 2 ** 31 - 1

const rnd = RANDOM_GEN

const FUNFACTS = ["**+600 lines!**", "Name derived from Super Famicom randomly!", "Scrapped content here", "By arc74!"]

const PERMISSION_DENIED = "You are not allowed to run this command!"
const VOTE_ERROR_INSTANCE = "There can be only one vote at a time!"
const RANK_ADMIN = "Administrator"
const RANK_ELEVATED = "Elevated user"
const RANK_USER = "Regular User"

const client = new Client("SFCBot [;]", [";"]);
let version = "2.3-release";
let oldversion = "1.0-release";

const responses = [
  "Yes, definitely.",
  "It is decidedly so.",
  "Without a doubt.",
  "Most likely.",
  "Outlook good.",
  "Reply hazy, try again.",
  "Cannot predict now.",
  "Don't count on it.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];


// Function to add a new user
async function addUser(userid, name) {
  const rawData = await fsPromises.readFile(databasePath, 'utf8');
  const database = JSON.parse(rawData);

  // Check if user with the same userid already exists
  const existingUser = database.users.find(user => user.userid === userid);

  if (!existingUser) {
    // User does not exist, add the new user
    database.users.push({ userid, name });
    await fsPromises.writeFile(databasePath, JSON.stringify(database, null, 2));
    console.log(`User with userid ${userid} added successfully.`);
  } else {
    // User already exists, do not add
    console.log(`User with userid ${userid} already exists.`);
  }
}


async function findUserById(userid) {
  const rawData = await fsPromises.readFile(databasePath, 'utf8');
  const database = JSON.parse(rawData);

  const user = database.users.find(user => user.userid === userid);

  return user ? user.name : null;
}

// Function to purge the database
async function purgedb() {
  const database = { users: [] };

  await fsPromises.writeFile(databasePath, JSON.stringify(database, null, 2));
}

// Countdown function
function countdown(seconds) {
  console.log(`Countdown started: ${seconds} seconds`);

  for (let i = seconds; i >= 0; i--) {
    setTimeout(() => {
      if (i === 0) {
        console.log('Countdown finished!');
      } else {
        console.log(`${i} seconds remaining...`);
      }
    }, (seconds - i) * 1000);
  }
}

function getLogTime() {
  const now = new Date();

  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds();
  const hundredths = Math.floor(milliseconds / 10).toString().padStart(2, '0');

  return `[${minutes}:${seconds}.${hundredths}]`;
}

function md5(input) {
  return createHash('md5').update(input).digest('hex');
}

function log(message) {
  console.log(getLogTime() + message);
}
function BotError(message) {
  client.sendMessage("[Error]: " + message);
  log(getLogTime() + "Error message = " + message);
}

function XOR(text, key) {
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return encrypted;
}


function formatUptime(uptimeInSeconds) {
  const hours = Math.floor(uptimeInSeconds / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeInSeconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function isUserElevated(userId, elevatedUsers) {
  if (!elevatedUsers || !Array.isArray(elevatedUsers)) {
    return false;
  }

  return elevatedUsers.includes(userId);
}

function isUserBanned(userId) {
  if (!client.blockedIDs || !Array.isArray(client.blockedIDs)) {
    return false;
  }

  return client.blockedIDs.includes(userId);
}

client.connect();

for (let i = 0; i < PERMABANNED.length; i++) {
  // 'array[i]' represents the current object in the array
  let currentID = PERMABANNED[i];

  // Run your command or function for each object
  // Example: console.log(currentObject.property);
  // Replace 'console.log(currentObject.property)' with your specific command or function
  console.log("Blocked PERMABANNED user: " + currentID);
  client.blockedIDs.add(currentID);
}

client.on("user-join", user => {
  console.log("New user connected: " + user.ID + "; name: " + user.escapedName);
  addUser(user.ID, user.escapedName);
});;

log(`[${getLogTime()} Loading command extensions...`)
await client.loadDirectory('./axtensions');

function isAdminConnected() {
  const users = client.users;
  const targetID = process.env["ADMIN_USER_ID"];
  const foundObject = users.find((obj) => obj.id === targetID);

  return foundObject ? true : false;
}

if (DEVMODE) {
  client.sendMessage(
    "Initializing the testing environment...\nNote that things might be unstable.",
  );
  version = "2.5-beta";
}

if (SAFEMODE) {
  client.commands.whoami = {
    description: "About the bot",
    handler: (context, ...args) => "whoami: SFCBot " + version,
  };
  client.commands.ignoreuser = {
    description: "Blocks a user",
    handler: (context, ...args) => {
      client.blockedIDs.add(args[0]);
      client.sendMessage(`ignoreuser: User blocked with ID: ${args[0]}.`);
    },
  };
  client.commands.echo = {
    description: "Prints a message",
    handler: (context, ...args) => {
      const message =
        args.length < 96
          ? `[Safe mode output]: ${args.join(" ")}`
          : "[Error]: Text length too long, restricted to only 96 chars in SAFE MODE!";
      client.sendMessage(message);
    },
  };
} else {
  client.commands.echo = {
    description: "Prints a message",
    handler: (context, ...args) => {
      const message =
        args.length < 128
          ? `echo: ${args.join(" ")}`
          : "[Error]: Text length too long, restricted to only 128 chars.";
      client.sendMessage(message);
    },
  };

  client.commands.author = {
    description: "Author of the bot.",
    handler: (context, ...args) => {
      child.exec("echo $REPL_OWNER", (error, stdout) => {
        if (!error) client.sendMessage(`author: ${stdout}`);
      });
    },
  };

  if (!PRODUCTION) {
    client.commands.banuser = {
      description: "Bans an user from bot usage.",
      handler: (x, context, ...args) => {
        if (x.message.author.ID === process.env["ADMIN_USER_ID"]) {
          client.blockedIDs.add(args[0]);
          client.sendMessage(`banuser: User blocked with ID: ${args[0]}.`);
        } else {
          BotError(PERMISSION_DENIED);
        }
      },
    };
  }

  client.commands.globalbroadcast = {
    description: "Broadcasts a message to the entire server.",
    handler: (x, context, ...args) => {
      if (x.message.author.ID === process.env["ADMIN_USER_ID"]) {
        client.sendMessage(`[Broadcast]: **${args.join(" ")}**`);
      } else {
        BotError(PERMISSION_DENIED);
      }
    },
    aliases: ["bc", "gb"]
  }

  if (DEVMODE) {
  }


  client.commands.shutdown = {
    description: "Shuts down the bot.",
    handler: (x, context) => {
      if (x.message.author.ID === process.env["ADMIN_USER_ID"]) {
        if (x.message.author.escapedName === process.env["ADMIN_USER"]) {

          client.sendMessage("Shutting down the bot...");
          client.disconnect();
        }
      } else {
        BotError(PERMISSION_DENIED);
      }
    }
  }
  client.commands.bugreport = {
    description: "Beta bug report.",
    handler: (context, ...args) => {
      client.sendMessage("bugreport: Bug report submitted.");
      console.log("Bug report: " + args.join(" "));
    },
  };

  client.commands.eightball = {
    description: "A simple yet useful 8-ball.",
    handler: (context, ...args) => {
      const randomIndex = Math.floor(Math.random() * responses.length);
      return `eightball: ${responses[randomIndex]}`;
    },
  };

  client.commands.ping = {
    description: "Shows Pong.",
    handler: (context, ...args) => "ping: Pong!",
  };

  client.commands.joke = {
    description: "Gets and shows a joke.",
    handler: (context, ...args) => {
      fetch("https://official-joke-api.appspot.com/jokes/random")
        .then((response) => response.json())
        .then((data) =>
          client.sendMessage(`joke: ${data.setup} ${data.punchline}`),
        );
    },
  };

  client.commands.whereistheiss = {
    description: "Where's the ISS at?",
    handler: (context, ...args) => {
      fetch("https://api.wheretheiss.at/v1/satellites/25544")
        .then((response) => response.json())
        .then((data) =>
          client.sendMessage(
            `whereistheiss:\nLatitude is: ${data.latitude}°\nLongitude is: ${data.longitude}°`,
          ),
        );
    },
  };

  client.commands.getaquote = {
    description: "Gets and shows a quote.",
    handler: (context, ...args) => {
      fetch("https://api.quotable.io/random")
        .then((response) => response.json())
        .then((data) =>
          client.sendMessage(
            `getaquote:\n\nQuote: ${data.content}\nAuthor, *${data.author}*`,
          ),
        );
    },
  };
  client.commands.date = {
    description: "Gets the date.",
    handler: (context, ...args) => {
      const date = new Date();
      const options = { timeZone: 'UTC' };

      const utcTime = new Intl.DateTimeFormat('en-US', options).format(date);
      client.sendMessage(`date: ${utcTime}`);
    },
    aliases: ["dt"]
  }
  client.commands.time = {
    description: "Gets the time UTC.",
    handler: (context, ...args) => {
      const date = new Date();
      const options = { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };

      const utcTime = date.toLocaleTimeString('en-US', options);
      client.sendMessage(`time: ${utcTime}`);
    }, aliases: ["tm"]
  }

  /*client.commands.isthereanadmin = {
    description: "Checks if there is an admin online.",
    handler: (context, ...args) => {
      if (isAdminConnected()) {
        client.sendMessage("isthereanadmin: Yes, there is an admin connected.");
      } else {
        client.sendMessage(
          "isthereanadmin: No, there is no admin connected."
        );
      }
    },
  };*/

  client.commands.rank = {
    description: "What's your rank?",
    handler: (x, context, ...args) => {
      const searchString = x.message.author.ID;

      const isAdmin = x.message.author.ID == process.env['ADMIN_USER_ID'];
      const isElevatedUser = !isAdmin && isUserElevated(searchString, elevatedUsers);

      if (isAdmin) {
        client.sendMessage(`rank: \nUser: **${x.message.author.escapedName}**\nRank: **Administrator**`);
      } else if (isElevatedUser) {
        client.sendMessage(`rank: \nUser: **${x.message.author.escapedName}**\nRank: **Elevated User**`);
      } else {
        client.sendMessage(`rank: \nUser: **${x.message.author.escapedName}**\nRank: **Regular User**`);
      }
    },
    subcommands: {
      get: {
        description: "Gets the rank of an ID x;",
        handler: (context, ...args) => {
          const searchString = args[0];
          const isAdmin = searchString == process.env['ADMIN_USER_ID'];
          const isElevatedUser = !isAdmin && isUserElevated(searchString, elevatedUsers);

          if (isAdmin) {
            client.sendMessage(`rank: \nUser: **${args[0]}**\nRank: **Administrator**`);
          } else if (isElevatedUser) {
            client.sendMessage(`rank: \nUser: **${args[0]}**\nRank: **Elevated User**`);
          } else if (!isElevatedUser && isUserBanned(searchString)) {
            client.sendMessage(`rank: \nUser: **${args[0]}**\nRank: **Ignored user**`);
          } else {
            client.sendMessage(`rank: \nUser: **${args[0]}**\nRank: **Regular User**`);
          }
        }
      }
    }
  }

  client.commands.uptime = {
    description: "Gets system uptime",
    handler: (x, context, ...args) => {
      client.sendMessage(`uptime: Bot running for ${formatUptime(process.uptime())}`);
    }
  }
  client.commands.userinfo = {
    description: "Shows your user info",
    handler: (x, context, ...args) => {

      let rank = "Unknown";

      const searchString = args[0];
      const isAdmin = searchString == process.env['ADMIN_USER_ID'];
      const isElevatedUser = !isAdmin && isUserElevated(searchString, elevatedUsers);

      if (isAdmin) {
        rank = "Administrator"
      } else if (isElevatedUser) {
        rank = "Elevated User"
      } else if (!isElevatedUser && isUserBanned(searchString)) {
        rank = "Ignored user"
      } else {
        rank = "Regular user"
      }

      client.sendMessage(`**User information**\nUsername: ${x.message.author.escapedName}\nID: ${x.message.author.ID}\nRank: ${rank}`);
    }
  }


  client.commands.vote = {
    description: "Self explanatory. Votes for something.",
    handler: (x, context, ...args) => {

      // Initialize the permissions

      const searchString = x.message.author.ID;
      const isAdmin = searchString == process.env['ADMIN_USER_ID'];
      const isElevatedUser = !isAdmin && isUserElevated(searchString, elevatedUsers);

      if (isAdmin || isElevatedUser) {
        if (!isAvoterunning) {
          isAvoterunning = true;
          client.sendMessage(`**${x.message.author.escapedName}** hosted a vote!\n**Vote:** ${args.join(" ").toString()}\n\nUse ;vote yes for **YES**, and ;vote no for **NO**.`);
          (async () => {
            // Wait for 15 seconds
            await new Promise(resolve => setTimeout(resolve, 15000));

            client.sendMessage(`**Vote results:**\nYes: ${votesYes}\nNo: ${votesNo}`);
            votesYes = 0;
            votesNo = 0;
            isAvoterunning = false;
          })();

        } else {
          BotError(VOTE_ERROR_INSTANCE);
        }
      } else {
        BotError(PERMISSION_DENIED)
        client.sendMessage(`**The minimum rank to use this command is: ${RANK_ELEVATED}!**`);
      }
    },
    subcommands: {
      yes: {
        description: "Vote yes",
        handler: (x, context, ...args) => {
          votesYes++
          client.sendMessage("You voted **yes**.")
        }
      },
      no: {
        description: "Vote no",
        handler: (x, context, ...args) => {
          votesNo++
          client.sendMessage("You voted **no**.")
        }
      }
    }
  }
  client.commands.db = {
    description: "Database administration",
    handler: () => { },
    subcommands: {
      view: {
        description: "View the UserDB",
        handler: (x, context, ...args) => {
          const searchString = x.message.author.ID;
          const isAdmin = searchString == process.env['ADMIN_USER_ID'];
          const isElevatedUser = !isAdmin && isUserElevated(searchString, elevatedUsers);

          if (isElevatedUser || isAdmin) {
            (async () => {
              const useridToFind = args[0];
              const userName = await findUserById(useridToFind);

              if (userName) {
                client.sendMessage(`User with userid ${useridToFind}: ${userName}`);
              } else {
                client.sendMessage(`User with userid ${useridToFind} not found.`);
              }
            })();
          }
        }
      },
      purge: {
        description: "Purge the UserDB",
        handler: (x, context, ...args) => {
          const searchString = x.message.author.ID;
          const isAdmin = searchString == process.env['ADMIN_USER_ID'];
          const isElevatedUser = !isAdmin && isUserElevated(searchString, elevatedUsers);

          if (isAdmin) {
            purgedb();
            client.sendMessage("UserDB cleared.")
          } else {
            BotError(PERMISSION_DENIED);
          }
        }
      }
    }
  }
  client.commands.testcmd = {
    description: "Test a command",
    handler: (x, context, ...args) => {
      if (x.message.author.ID === process.env["ADMIN_USER_ID"]) {
        client.sendMessage(args.join(" "));
        client.sendMessage("Message origin: User interaction.")
      } else {
        BotError(PERMISSION_DENIED);
      }
    }
  }

  client.commands.encode = {
    description: "Base64 encodes/decodes.",
    handler: (context) => {
      client.sendMessage("Command info: Encodings for you to use;");
    },
    subcommands: {
      b64encode: {
        description: "Base64 encodes.",
        handler: (context, ...args) => {
          client.sendMessage(
            `encode: ${btoa(args.join(" "))}`
          );
        },
      },
      b64decode: {
        description: "Base64 decodes.",
        handler: (context, ...args) => {
          client.sendMessage(`encode: ${atob(args.join(" "))}`);
        }
      },
      encodedURIcompnent: {
        description: "Encoded URI components;",
        handler: (context, ...args) => {
          client.sendMessage("Command info: Encoded URI components for you to use;");
        },
        subcommands: {
          encode: {
            description: "Encodes an EncodedURIComponent",
            handler: (context, ...args) => {
              client.sendMessage(`encode: ${encodeURIComponent(args.join(" ").toString())}`);
            },
            decode: {
              description: "Decodes an EncodedURIComponent",
              handler: (context, ...args) => {
                client.sendMessage(`encode: ${decodeURIComponent(args.join(" ").toString())}`);
              }
            }
          }
        }
      }
    }

  }
  client.commands.random = {
    description: "Gets a random number.",
    handler: (context, ...args) => {
      let value = rnd.integer(NEG_MAX_INT, MAX_INT);
      client.sendMessage(`random: ${value}`);
    },
  }
  client.commands.randomrange = {
    description: "Gets a random number in range x and y.",
    handler: (context, ...args) => {
      if (isFinite(args[0]) && isFinite(args[1]) && !isNaN(args[0]) && !isNaN(args[1])) {
        let value = rnd.integer(parseInt(args[0]), parseInt(args[1]));
        client.sendMessage(`randomrange: ${value}`);
      } else {
        BotError("Range cannot be NaN or Infinity.");
      }
    },
    aliases: ['randrange']
  }
  client.commands.md5 = {
    description: "Gets md5 hash of a string.",
    handler: (context, ...args) => {
      client.sendMessage(`md5: ${md5(args.join(" "))}`);
    }
  }
  client.commands.fromhex = {
    description: "Converts hex to decimal.",
    handler: (context, ...args) => {
      if (args.length > 0) {
        const hexValue = args[0];
        const decimalValue = parseInt(hexValue, 16);

        if (!isNaN(decimalValue)) {
          client.sendMessage(`fromhex: ${decimalValue}`);
        } else {
          BotError("Invalid hex value provided.");
        }
      } else {
        BotError("No hex value provided.");
      }
    }
  };

  client.commands.tohex = {
    description: "Converts decimal to hex.",
    handler: (context, ...args) => {
      if (args.length > 0) {
        const decimalValue = Number(args[0]);

        if (!isNaN(decimalValue)) {
          client.sendMessage(`tohex: ${decimalValue.toString(16)}`);
        } else {
          BotError("Invalid decimal value provided.");
        }
      } else {
        BotError("No decimal value provided.");
      }
    }
  };
  client.commands.calculate = {
    description: "Calculates a given expression.",
    aliases: ["calc"],
    handler: (context, ...args) => {
      let evresult = mathjs.evaluate(args.join(" ").toString());
      client.sendMessage(`calculate: \nExpression: ${args.join().toString()}\n Result: ${evresult}`);
    }
  }
  client.commands.credits = {
    description: "Credits for people who made packages/APIs...",
    handler: (context, ...args) => {
      client.sendMessage("Packages: \n**Math.js**\n**Random.js**\n**randomstring**\n\nAPIs: \n**Where's the ISS at?**\n**Official Joke API**\n**Quotable API**\n\nSpecial Thanks to:\n**ming736 -- For helping me to debug the code.**")
    }
  }
  client.commands.randstr = {
    description: "Generates a random string.",
    handler: (context, ...args) => {
      if (+args[0] < 56) {
        log(args[0])
        let rstr = randomstring.generate({
          length: +args[0],
          charset: args[1]
        });
        client.sendMessage(`randstr: ${rstr}`);
      } else {
        BotError("Maximum length for RandStr restricted to 56.")
        log("Received an invalid argument for randstr: " + args[0].toString() + " from user ID: " + context.message.author.ID + "with the name: " + context.message.author.escapedName);
      }
    }
  }
  client.commands.funfact = {
    description: "Gets a random fun fact.",
    handler: (context, ...args) => {
      let randomindex = RANDOM_GEN.integer(0, FUNFACTS.length - 1);
      client.sendMessage(`funfact: ${FUNFACTS[randomindex]}`);
    }

  }
  client.commands.version = {
    description: "Gets the version of the bot.",
    handler: (context, ...args) => {
      client.sendMessage(`**SFCBot**\nVersion: ${version}\nRunning on Node.js ${process.version}`);
    },
    aliases: ["about", "info", "a"]
  }
};
