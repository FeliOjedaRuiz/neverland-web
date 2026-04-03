import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, schema }) => {
	const defaultTitle = 'Neverland - Parque Infantil y Celebraciones';
	const baseDescription =
		'Neverland es el mejor parque infantil en Cúllar Vega (Granada). Celebra el cumpleaños de tus hijos con parque de bolas, talleres, pintacaras y mucha diversión.';

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
