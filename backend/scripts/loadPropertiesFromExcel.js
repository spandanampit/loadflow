const Excel = require('exceljs');
const db = require('../database/dbConfig');
const Element = require('../models/Element');
const ElementProperty = require('../models/ElementProperty');

const filePath = 'H:/xampp/htdocs/freelancer/brainium/loadflow/backend/mnt/data/LFH.xlsx'; // Adjust based on actual location


async function loadPropertiesFromExcel() {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheets = {
        Shunt: ['BUS', 'Generator', 'LOAD', 'InductionMotor', 'Shunt', 'Filter'],
        Series: ['Transformer', 'Line']
    };

    // Map sheet names to category names for better processing
    const sheetCategoryMap = {
        'BUS': 'Shunt',
        'Generator': 'Shunt',
        'LOAD': 'Shunt',
        'InductionMotor': 'Shunt',
        'Shunt': 'Shunt',
        'Filter': 'Shunt',
        'Transformer': 'Series',
        'Line': 'Series',
    };

    // Iterate over all sheets to extract data
    for (const [category, sheetNames] of Object.entries(sheets)) {
        for (const sheetName of sheetNames) {
            const worksheet = workbook.getWorksheet(sheetName);

            worksheet.eachRow(async (row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row

                const elementName = row.getCell(1).value; // Assume column 1 is the element name
                const properties = [];

                // Assuming properties start from column 2
                for (let i = 2; i <= row.cellCount; i++) {
                    const propertyName = worksheet.getRow(1).getCell(i).value; // Header row contains property names
                    const propertyValue = row.getCell(i).value;

                    if (propertyName && propertyValue) {
                        properties.push({ propertyName, propertyValue });
                    }
                }

                // Find the element by name and category
                const element = await Element.findOne({ where: { name: elementName, category } });

                if (element) {
                    // Insert all properties for this element
                    for (const { propertyName, propertyValue } of properties) {
                        await ElementProperty.create({
                            elementId: element.id,
                            propertyName,
                            propertyValue,
                        });
                    }
                }
            });
        }
    }

    console.log('Properties loaded into the database');
}

loadPropertiesFromExcel();

