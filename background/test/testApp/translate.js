const Firestore = require('@google-cloud/firestore');
const {Translate} = require('@google-cloud/translate').v2;

const firestore = new Firestore();
const translate = new Translate();

exports[`translate-${process.env.unique_id}`] = async pubSubEvent => {
  const {language, original} = JSON.parse(
    Buffer.from(pubSubEvent.data, 'base64').toString()
  );

  const [
    translated,
    {
      data: {translations},
    },
  ] = await translate.translate(original, language);
  const originalLanguage = translations[0].detectedSourceLanguage;
  console.log(
    `Translated ${original} in ${originalLanguage} to ${translated} in ${language}.`
  );

  // Store translation in firestore.
  await firestore
    .collection(`translations`)
    .doc()
    .set({
      language,
      original,
      translated,
      originalLanguage,
    });
};
