/***
 *                                                         _
 *                                                        | |
 *      _   _ ___  ___ _ __ ______ ___  ___  __ _ _ __ ___| |__
 *     | | | / __|/ _ \ '__|______/ __|/ _ \/ _` | '__/ __| '_ \
 *     | |_| \__ \  __/ |         \__ \  __/ (_| | | | (__| | | |
 *      \__,_|___/\___|_|         |___/\___|\__,_|_|  \___|_| |_|
 *
 *     by quantiom
 */

const { cleanList, usernameFound } = require('./functions');
const siteList = cleanList(require('./sites.json'));
const { ArgumentParser } = require('argparse');
const rp = require('request-promise');
const colors = require('colors'); // console colors
const fs = require('fs');

// add arguments
const parser = new ArgumentParser({
	version: '1.0.0',
	addHelp: true,
	description: 'User search',
});

parser.addArgument(['-username', '-u'], {
	help: 'The username to search for.',
	required: true,
});

parser.addArgument(['-results', '-r'], {
    help: 'The results folder directory.',
    defaultValue: './results'
})

const { username, results } = parser.parseArgs();

console.log(`${'Searching for: '.brightRed.bold}${username.white.bold}${'...'.brightRed}\n`);

(async () => {
	let hits = [];

	for (_site in siteList) {
		let site = siteList[_site];

		if (site.regexCheck && !username.match(site.regexCheck)) {
			console.log(`${'[x]'.yellow} ${`Invalid username format for ${_site}.`.white.bold}`);
			continue;
		}

		try {
			await rp({
				uri: site.url.replace('{}', username),
				resolveWithFullResponse: true,
				method: 'GET',
				timeout: 2500,
			})
            .then(res => {
                if (!res || !res.body) return;

                if (usernameFound(site, res)) {
                    console.log(`${'[x]'.green} ${`Username found on ${_site}.`.white.bold}`);
                    hits.push(site.url.replace('{}', username));
                } else {
                    console.log(`${'[x]'.red} ${`Username not found on ${_site}.`.white.bold}`);
                }
            })
            .catch(err => {
                if (!err.response || !err.response.body) return;

                if (usernameFound(site, err, true)) {
                    console.log(`${'[x]'.green} ${`Username found on ${_site}.`.white.bold}`);
                    hits.push(site.url.replace('{}', username));
                } else {
                    console.log(`${'[x]'.red} ${`Username not found on ${_site}.`.white.bold}`);
                }
            });
		} catch (e) {
			console.log(`${'[x]'.red} An error occured: ${e}`);
		}
	}

	console.log(`${'\nUsername found on '.white}${hits.length.toString().brightRed} ${'sites'.white}`);

	const fileName = `${username}-${Date.now()}`;
	fs.writeFileSync(`${results}/${fileName}.txt`, hits.join('\n'), 'utf8');

	console.log(`${'Saved hits to '}${`results/${fileName}.txt`}`);
})();
