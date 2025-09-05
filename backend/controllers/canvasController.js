const CanvasData =  require('../models/CanvasData'); 


// exports.storeCanvas = async (req, res) => {
//     console.log("before try in createElementProperty");
//     try {
//         console.log("before findAll");
//         console.log("req",req.body);
//         const canvas = await CanvasData.create({
//             name: req.body.name,
//             thumbnail_image: req.body.thumbnailImage,
//             canvas_object: req.body.canvasObject
//           }); // Fetching all elements from the database
//         res.status(200).json(canvas); // Return elements in JSON format with a 200 status
//     } catch (error) {
//         console.error('Error fetching elements:', error); // Log the error for debugging purposes
//         res.status(500).json({ error: 'Error fetching elements' }); // Respond with a 500 error message
//     }
// };

exports.storeCanvas = async (req, res) => {
    console.log("before try in createOrUpdateCanvas");
    try {
        console.log("before findOrCreateOrUpdate");
        console.log("req", req.body);

        // Check if ID exists in request body, indicating an update
        if (req.body.id) {
            // Try to update the canvas with the given ID
            const [updated] = await CanvasData.update(
                {
                    name: req.body.name,
                    thumbnail_image: req.body.thumbnailImage,
                    canvas_object: req.body.canvasObject
                },
                {
                    where: { id: req.body.id }
                }
            );

            if (updated) {
                // Fetch the updated canvas and return it
                const updatedCanvas = await CanvasData.findOne({ where: { id: req.body.id } });
                return res.status(200).json(updatedCanvas);
            } else {
                return res.status(404).json({ error: 'Canvas not found for update' });
            }
        } else {
            // If no ID is provided, create a new canvas
            const canvas = await CanvasData.create({
                name: req.body.name,
                thumbnail_image: req.body.thumbnailImage,
                canvas_object: req.body.canvasObject
            });
            res.status(201).json(canvas); // Return new canvas with a 201 status
        }
    } catch (error) {
        console.error('Error creating or updating canvas:', error);
        res.status(500).json({ error: 'Error creating or updating canvas' });
    }
};


exports.getAllCanvas = async (req, res) => {
    console.log("before try in createElementProperty");
    try {
        console.log("before findAll");
        console.log("req",req.body);
        const canvas = await CanvasData.findAll();
        res.status(200).json(canvas); // Return elements in JSON format with a 200 status
    } catch (error) {
        console.error('Error fetching elements:', error); // Log the error for debugging purposes
        res.status(500).json({ error: 'Error fetching elements' }); // Respond with a 500 error message
    }
};