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

const fs = require('fs');
const readline = require('readline-promise').default;
const colors = require('colors');

const rlp = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true,
});

const ask = async (msg = '') => {
	if (msg) console.log(msg);

	let procedure = (await rlp.questionAsync(`Add or remove site? ${'[add, remove]'.red}: `)).toLowerCase();
	if (!['add', 'remove'].includes(procedure)) return ask('Invalid answer.');

    let pushList = require('./sites.json');

	if (procedure == 'add') {
		let siteName = await rlp.questionAsync(`Site name ${'[ex: Twitter]'.red}: `);
		let urlMain = await rlp.questionAsync(`Main URL ${'[ex: https://www.twitter.com]'.red}: `);
		let url = await rlp.questionAsync(
			`User URL (Replace the username with {}) ${'[ex: https://www.twitter.com/{}]'.red}: `
		);

		pushList[siteName] = { url, urlMain };

		console.log('\nStatus code: Anything but a 200 status code will count as not found.');
		console.log(
			'Message: If this message is included in the body of the page, the username will count as not found.'
		);
		console.log('Response URL: Use this if the site redirects you on an invalid username.\n');

		const errorAsking = async (msg = '') => {
			return new Promise(async resolve => {
				if (msg) console.log(msg);

				let errorType = (await rlp.questionAsync(
					`Error type ${'[status_code, message, response_url]'.red}: `
				)).toLowerCase();
				if (!['status_code', 'message', 'response_url'].includes(errorType))
					return errorAsking('Invalid answer');

				pushList[siteName] = { ...pushList[siteName], errorType };

				if (errorType == 'message') {
					let message = await rlp.questionAsync(`Message ${'[ex: User not found]'.red}: `);
					pushList[siteName] = { ...pushList[siteName], errorMsg: message };
				} else if (errorType == 'response_url') {
					let responseURL = await rlp.questionAsync(
						`Response URL to check for ${'[ex: site.com/invalid_user]'.red}: `
					);
					pushList[redirectURL] = { ...pushList[siteName], response_url: responseURL };
				}

				resolve();
			});
		};

		await errorAsking();

		let regexCheck = await rlp.questionAsync(
			`Regex match for valid usernames ${'[not required, press enter to skip]'.red}: `
		);

		if (regexCheck.length) pushList[siteName] = { ...pushList[sitename], regexCheck };

		fs.writeFileSync('./sites.json', JSON.stringify(pushList, null, 4), 'utf8');

		console.log(`Successfully added ${siteName.red}.`);

		ask();
	} else if (procedure == 'remove') {
        let siteName = await rlp.questionAsync(`Site name ${'[ex: Spotify]'.red}: `);

        if (!pushList[siteName]) ask('Invalid site name.');
        delete pushList[siteName];

        fs.writeFileSync('./sites.json', JSON.stringify(pushList, null, 4), 'utf8');

        console.log(`Successfully removed ${siteName.red}.`);

        ask();
	}
};

ask();
