import requests

# بيانات الاتصال
endpoint = "https://api.indexnow.org/IndexNow"

# البيانات المطلوب إرسالها
payload = {
    "host": "imadtbn.github.io",
    "key": "0632e085d27e42b8b4ac1af49972b049",
    "keyLocation": "https://imadtbn.github.io/dz_portal/0632e085d27e42b8b4ac1af49972b049.txt",
    "urlList": [
"https://imadtbn.github.io/dz_portal/index.html",
"https://imadtbn.github.io/dz_portal/sectors/education.html",
"https://imadtbn.github.io/dz_portal/sectors/progres.mesrs.html",
"https://imadtbn.github.io/dz_portal/sectors/interieur.html",
"https://imadtbn.github.io/dz_portal/sectors/markabatidz.html",
"https://imadtbn.github.io/dz_portal/sectors/onpo.html",
"https://imadtbn.github.io/dz_portal/sectors/anae.html",
"https://imadtbn.github.io/dz_portal/sectors/sante.html",
"https://imadtbn.github.io/dz_portal/sectors/facteur.html",
"https://imadtbn.github.io/dz_portal/sectors/sonalgaz.html",
"https://imadtbn.github.io/dz_portal/sectors/mf.gov.html",
"https://imadtbn.github.io/dz_portal/sectors/mtess.html",
"https://imadtbn.github.io/dz_portal/sectors/poste.html",
"https://imadtbn.github.io/dz_portal/sectors/algerietelecom.html",
"https://imadtbn.github.io/dz_portal/sectors/mhuv.gov.html",
"https://imadtbn.github.io/dz_portal/sectors/mjustice.html",
"https://imadtbn.github.io/dz_portal/sectors/transport.html",
"https://imadtbn.github.io/dz_portal/sectors/dzexams.html",
"https://imadtbn.github.io/dz_portal/sectors/dzexam1.html",
"https://imadtbn.github.io/dz_portal/sectors/dzexam.pro.html",
"https://imadtbn.github.io/dz_portal/sectors/qassimatouka.html",
"https://imadtbn.github.io/dz_portal/sectors/tabioucom.html",
"https://imadtbn.github.io/dz_portal/sectors/fadaeldjazair.html",
"https://imadtbn.github.io/dz_portal/sectors/facture_loyer.html",
"https://imadtbn.github.io/dz_portal/sectors/emergency.html",
"https://imadtbn.github.io/dz_portal/sectors/mfp.gov.html",
"https://imadtbn.github.io/dz_portal/sectors/telephon.html",
"https://imadtbn.github.io/dz_portal/sectors/arpce.html",
"https://imadtbn.github.io/dz_portal/sectors/dgsn.html",
"https://imadtbn.github.io/dz_portal/sectors/ina-elections.html",
"https://imadtbn.github.io/dz_portal/sectors/ade.html",
"https://imadtbn.github.io/dz_portal/sectors/seaal.html",
"https://imadtbn.github.io/dz_portal/sectors/naftal.html",
"https://imadtbn.github.io/dz_portal/sectors/mfa.html",
"https://imadtbn.github.io/dz_portal/sectors/madr.html",
"https://imadtbn.github.io/dz_portal/sectors/aapi.html",
"https://imadtbn.github.io/dz_portal/sectors/hatplc.html",
"https://imadtbn.github.io/dz_portal/sectors/ocrc.html",
"https://imadtbn.github.io/dz_portal/sectors/aadl.html",
"https://imadtbn.github.io/dz_portal/sectors/enpi.html",
"https://imadtbn.github.io/dz_portal/sectors/opgi.html",
"https://imadtbn.github.io/dz_portal/sectors/anem.html",
"https://imadtbn.github.io/dz_portal/sectors/msnfcf.gov.html",
"https://imadtbn.github.io/dz_portal/sectors/commerce.html",
"https://imadtbn.github.io/dz_portal/sectors/campuce.jobs.html",
"https://imadtbn.github.io/dz_portal/sectors/mjeunesse.gov.html",
"https://imadtbn.github.io/dz_portal/sectors/bank.html",
"https://imadtbn.github.io/dz_portal/sectors/assurance.html",
"https://imadtbn.github.io/dz_portal/sectors/markabatidz.html",
"https://imadtbn.github.io/dz_portal/sectors/facteur.html",
"https://imadtbn.github.io/dz_portal/pages/about.html",
"https://imadtbn.github.io/dz_portal/sectors/eddirasa.html",
"https://imadtbn.github.io/dz_portal/sectors/etudpdf.html",
"https://imadtbn.github.io/dz_portal/sectors/mf.gov.html",
"https://imadtbn.github.io/dz_portal/sectors/exam-compos.html",
"https://imadtbn.github.io/dz_portal/sectors/dztests.html",
"https://imadtbn.github.io/dz_portal/sectors/me.gov.html",
"https://imadtbn.github.io/dz_portal/sectors/nifenligne.html",
"https://imadtbn.github.io/dz_portal/sectors/t-onec.html",
"https://imadtbn.github.io/dz_portal/sectors/ecolerradja.html",
"https://imadtbn.github.io/dz_portal/sectors/seor.html",
"https://imadtbn.github.io/dz_portal/sectors/mdn.html",
"https://imadtbn.github.io/dz_portal/sectors/mobilis.html",
"https://imadtbn.github.io/dz_portal/sectors/djezzy.html",
"https://imadtbn.github.io/dz_portal/sectors/ooredoo.html",


"https://imadtbn.github.io/dz_portal/pages/terms.html",
"https://imadtbn.github.io/dz_portal/pages/about.html",
"https://imadtbn.github.io/dz_portal/pages/contact.html",
"https://imadtbn.github.io/dz_portal/pages/privacy.html"

    ]
}

# إرسال الطلب
response = requests.post(endpoint, json=payload)

# عرض النتيجة
print("Status Code:", response.status_code)
print("Response:", response.text)
