const mongoose = require('mongoose');
require('dotenv').config();

const migrate = async () => {
    try {
        console.log('--- Iniciando migración de consentimientos (Modo Robusto) ---');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB.');

        const db = mongoose.connection.db;
        const collection = db.collection('events');

        const events = await collection.find({ tipo: 'reserva' }).toArray();
        console.log(`Encontradas ${events.length} reservas para procesar.`);

        let updatedCount = 0;

        for (const event of events) {
            const oldExtras = event.detalles?.extras || {};
            
            // Verificamos si tiene los campos en la ubicación antigua
            const hasOldPP = oldExtras.privacyPolicyConsent !== undefined;
            const hasOldMC = oldExtras.marketingConsent !== undefined;
            const hasOldFC = oldExtras.fechaConsentimiento !== undefined;

            if (hasOldPP || hasOldMC || hasOldFC) {
                console.log(`Migrando reserva ${event.publicId || event._id}...`);

                const updateQuery = { $set: {}, $unset: {} };

                if (hasOldPP) {
                    updateQuery.$set['cliente.privacyPolicyConsent'] = oldExtras.privacyPolicyConsent;
                    updateQuery.$unset['detalles.extras.privacyPolicyConsent'] = "";
                }
                if (hasOldMC) {
                    updateQuery.$set['cliente.marketingConsent'] = oldExtras.marketingConsent;
                    updateQuery.$unset['detalles.extras.marketingConsent'] = "";
                }
                if (hasOldFC) {
                    updateQuery.$set['cliente.fechaConsentimiento'] = oldExtras.fechaConsentimiento;
                    updateQuery.$unset['detalles.extras.fechaConsentimiento'] = "";
                }

                // Ejecutamos la actualización
                await collection.updateOne({ _id: event._id }, updateQuery);
                updatedCount++;
            }
        }

        console.log(`--- Migración finalizada ---`);
        console.log(`Documentos actualizados: ${updatedCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
};

migrate();
