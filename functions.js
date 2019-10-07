const fs = require('fs');

module.exports = {
    cleanList: (siteList) => {
        for (_site in siteList) {
            let site = siteList[_site];

            if (site.username_claimed) {
                delete site.username_claimed;
            }

            if (site.username_unclaimed) {
                delete site.username_unclaimed;
            }

            if (site.rank) {
                delete site.rank;
            }
        }

        fs.writeFileSync('./sites.json', JSON.stringify(siteList, null, 4), 'utf8');

        return siteList;
    },

    usernameFound: (site, res, err = false) => {
        if (site.errorType == 'status_code')
            return res.statusCode == 200;
        else if (site.errorType == 'message')
            return err ? !(res.response.body.includes(site.errorMsg)) : !(res.body.includes(site.errorMsg));
        else if (site.errorType == 'response_url' && res.request && res.request.uri && res.request.href)
            return !(res.request.uri.href.includes(site.errorUrl));
    }
}