// Function to replace placeholders in HTML templates
export function replaceTemplatePlaceholders(htmlContent) {
    const isProduction = process.env.NODE_ENV === 'production';
    const basePath = isProduction ? '/compose' : '';

    const replacements = {
        '{{project_root_url}}': `${basePath}/`,
        '{{logo_path}}': `${basePath}/pi-co.png`,
        '{{collection_link}}': `${basePath}/collections`,
        '{{index_link}}': `${basePath}/`,
        '{{lz_string_lib_path}}': `${basePath}/lz-string.min.js`,
        '{{dynamic_background}}': '' // Remove the dynamic background
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return htmlContent;
}