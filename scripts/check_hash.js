
const bcrypt = require('bcryptjs');

async function main() {
    const hash = "$2b$10$DrgpRuffSd5Inkc0BfmfnucyM2hEpD3j9irat2GsjTVejvDozTOuG";
    const password = "password123";
    const match = await bcrypt.compare(password, hash);
    console.log(`Password '${password}' matches hash: ${match}`);
}

main();
