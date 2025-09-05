const Element = require('./Element');
const ElementProperty = require('./ElementProperty');

// Define associations
// Element.hasMany(ElementProperty, { foreignKey: 'elementId' });
// ElementProperty.belongsTo(Element, { foreignKey: 'elementId' });

Element.hasMany(ElementProperty, { as: 'properties', foreignKey: 'elementId' });
ElementProperty.belongsTo(Element, { foreignKey: 'elementId' });

