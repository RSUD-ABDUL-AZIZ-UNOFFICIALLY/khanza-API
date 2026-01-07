const fs = require('fs');


async function find(params) {

    // let data = fs.readFileSync('cache/' + 'RawRalanUTAMA9-11' + '.json');
    // data = JSON.parse(data);
    // // console.log(data.DPJP_UTAMA[0]);
    // let filteredData = data.DPJP_UTAMA.filter(item => item.poli === 'HEMODIALISA');
    // console.log(filteredData.length);
    let dataOld = fs.readFileSync('cache/' + 'HD' + '.json');
    dataOld = JSON.parse(dataOld);
    console.log(dataOld.length);
    let total = 0;
    let countBySetujui = dataOld.reduce((obj, item) => {
        let setujui = item.bySetujui;
        // console.log(setujui);
        total += setujui;
        return total;
    }, {});
    console.log(countBySetujui);
    
}
find();