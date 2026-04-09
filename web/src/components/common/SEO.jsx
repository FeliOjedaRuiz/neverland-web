import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, schema }) => {
	const defaultTitle = 'Neverland - Parque Infantil y Celebraciones';
	const baseDescription =
		'Neverland es la mejor ludoteca, parque de bolas y salón de eventos en Cúllar Vega (Granada). Especialistas en cumpleaños infantiles para familias de Vegas del Genil y toda Granada.';

	const fullTitle =
		title && title !== defaultTitle ? `${title} | Neverland` : defaultTitle;

	return (
		<Helmet>
			<title>{fullTitle}</title>
			<meta name="description" content={description || baseDescription} />

			{/* Open Graph Dinámico */}
			<meta property="og:title" content={fullTitle} />
			<meta property="og:description" content={description || baseDescription} />

			{/* Twitter Dinámico */}
			<meta property="twitter:title" content={fullTitle} />
			<meta
				property="twitter:description"
				content={description || baseDescription}
			/>

			{/* Datos Estructurados JSON-LD */}
			{schema && (
				<script type="application/ld+json">{JSON.stringify(schema)}</script>
			)}
		</Helmet>
	);
};

export default SEO;
