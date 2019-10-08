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

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { cleanList, usernameFound } = require('./functions');
const { ArgumentParser } = require('argparse');
const rp = require('request-promise');
const colors = require('colors'); // console colors
const fs = require('fs');
let siteList = require('./sites.json');

if (isMainThread) {
	// add arguments
	siteList = cleanList(siteList);

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
		defaultValue: './results',
	});

	parser.addArgument(['-threads', '-t'], {
		help: 'How many threads to use.',
		defaultValue: 1
	});

	const { username, results, threads } = parser.parseArgs();

	console.log(`${'Searching for: '.brightRed.bold}${username.white.bold}${'...'.brightRed}\n`);
	
	const remainder = Object.keys(siteList).length % threads;
	const perThread = (Object.keys(siteList).length - remainder) / threads;

	let curIdx = 0;
	let hits = [];
	let threadsThatSentMessage = 0;

	for (let i = 0; i < threads; i++) {
		let lastThread = i == threads - 1;
		let amount = lastThread ? perThread + parseInt(remainder) : perThread;

		let worker = new Worker(__filename, {
			workerData: { amount, curIdx, username }
		});

		worker.on('message', (message) => {
			hits = [...hits, ...message];
			threadsThatSentMessage++;

			if (threadsThatSentMessage == threads) {
				console.log(`${'\nUsername found on '.white}${hits.length.toString().brightRed} ${'sites'.white}`);

				const fileName = `${username}-${Date.now()}`;
				fs.writeFileSync(`${results}/${fileName}.txt`, hits.join('\n'), 'utf8');

				console.log(`${'Saved hits to '}${`results/${fileName}.txt`}`);

				process.exit();
			}
		});

		curIdx += amount;
	}
} else {
	let hits = [];
	let username = workerData.username;

	(async () => {
		for (let i = workerData.curIdx; i < parseInt(workerData.curIdx + workerData.amount); i++) {
			let _site = Object.entries(siteList)[i][0];
			let site = Object.entries(siteList)[i][1];
	
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

		parentPort.postMessage(hits);
	})();
}