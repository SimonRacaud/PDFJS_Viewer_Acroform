import { PDFManager } from './viewer'

/**
 * Generate a random string
 * @param {*} length integer 
 */
function makeid(length) {
    let result              = '';
    const characters        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength  = characters.length;

    for (let i = 0; i < length; i++) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const main = async () => {
    // Load and Show the PDF
    const doc = await PDFManager.loadPDF();

    // read Button
    document.getElementById("read").addEventListener("click", async (event) => {
        console.info( await PDFManager.readFormData(doc) );
    });

    // write Button
    document.getElementById("write").addEventListener("click", (event) => {
        PDFManager.writeFormData(doc,
        [
            { id: "285R", value: "Simon RACAUD" },
            { id: "284R", value: makeid(13) },
            { id: "286R", value: makeid(10) },
            { id: "289R", value: makeid(5) },
            { id: "298R", value: makeid(8) }
        ]);
    });

    // save/download Button
    document.getElementById("save").addEventListener("click", (event) => {
        PDFManager.downloadPDF(doc);        
    });
};

main();
