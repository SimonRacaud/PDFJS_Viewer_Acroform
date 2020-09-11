import 'regenerator-runtime/runtime';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { EventBus, PDFPageView, DefaultAnnotationLayerFactory, DefaultTextLayerFactory } from 'pdfjs-dist/web/pdf_viewer'
import { FormValue } from './FormValue';

/** The PDF */
import CERFA from '../../assets/pdf/CERFA-AvisArretTravail.pdf';

GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

class PDFManager {
    static eventBus = new EventBus();
    static defaultScale = 1.2;
    static containerId = "pageContainer";

    /**
     * Show the PDF document in HTML
     * @param {*} doc PDFDocumentProxy
     * @return PDFDocumentProxy
     */
    static async #loadDocument (doc) {
        const container = document.getElementById(this.containerId);
        
        for (let i = 1; i <= doc.numPages; i++) {
            await doc.getPage(i).then((pdfPage) => {
                // Create the page view.
                const pdfPageView = new PDFPageView({
                    container: container,
                    id: i,
                    scale: this.defaultScale,
                    defaultViewport: pdfPage.getViewport({ scale: this.defaultScale }),
                    eventBus: this.eventBus,
                    annotationLayerFactory: new DefaultAnnotationLayerFactory(),
                    textLayerFactory: new DefaultTextLayerFactory(),
                    renderInteractiveForms: true,
                });
        
                // Associate the actual page with the view and draw it.
                pdfPageView.setPdfPage(pdfPage);
                return pdfPageView.draw();
            });
        }
        return doc;
    }

    /**
     * Load the PDF in the viewer
     * @return PDFDocumentProxy
     */
    static async loadPDF () {
        const doc = await getDocument(CERFA).promise;

        return this.#loadDocument(doc);
    }

    /**
     * Read the annotations of the document and return them as an array of FormValue
     * @param {*} doc PDFDocumentProxy
     * @return array
     */
    static async readFormData (doc) {
        let formData = [];

        for (let i = 1; i <= doc.numPages; i++) {
            doc.getPage(i).then((page) => {
                page.getAnnotations().then((annotations) => {
                    for (let j = 0; j < annotations.length; j++) {
                        const parentEl = document.querySelector("[data-annotation-id='"+ annotations[j].id +"']");
                        let el = null;
                        let value;

                        if (parentEl) {
                            el = parentEl.firstElementChild;
                        }
                        if (null === parentEl || null === el) {
                            continue;
                        } else if (el.type === "checkbox") {
                            value = el.checked;
                        } else {
                            value = el.value;
                        }

                        formData.push(
                            new FormValue(
                                annotations[j].id,
                                value,
                                el.type,
                                annotations[j].fieldName
                            )
                        );
                    }
                });
            });
        }
        return await formData;
    }

    /**
     * Set the value of form fields
     * @param {*} doc PDFDocumentProxy
     * @param {*} formValues array of FromValue objects
     */
    static writeFormData(doc, formValues = []) {
        for (let i = 1; i <= doc.numPages; i++) {
            doc.getPage(i).then(function (page) {
                page.getAnnotations().then(function(annotations) {
                    for (let j = 0; j < annotations.length; j++) {
                        let el = null;
                        const obj = formValues.find(o => (o.id === annotations[j].id))
                        
                        if (undefined === obj) {
                            continue;
                        }
                        const parentEl = document.querySelector("[data-annotation-id='"+ annotations[j].id +"']");
                        if (parentEl) {
                            el = parentEl.firstElementChild;
                        }
                        if (null === parentEl || null === el) {
                            continue;
                        }

                        if (el.type === "checkbox") {
                            el.checked = obj.value;
                        } else {
                            el.value = obj.value;
                        }
                    }
                });
            });
        }
    }

    /**
     * Download the PDF with the annotation's content
     * @param {*} doc PDFDocumentProxy
     * @param {*} fileName String
     */
    static async downloadPDF (doc, fileName = "newFile.pdf") {
        const data = await this.readFormData(doc);
        const _this = this;

        for (const item of data) {
            doc.annotationStorage.setValue(item.id, item.value);
        }
        doc.saveDocument(doc.annotationStorage).then(function (data, fn) {
            _this.#downloadAsFile(data, fileName);
        });
    }

    /**
     * Download an Uint8Array as a file  
     * @param {*} data Uint8Array 
     * @param {*} fileName String
     * @param {*} fileType String
     */
    static #downloadAsFile (data, fileName, fileType = "application/pdf") {
        const blob = new Blob([data], { type: fileType });
        const a = document.createElement('a');

        a.download = fileName;
        a.href = URL.createObjectURL(blob);
        a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(
            () => { URL.revokeObjectURL(a.href); }
        , 1500);
    }
}

export { PDFManager };
