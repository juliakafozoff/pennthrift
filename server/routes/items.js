const Item = require('../models/item.model');
const router = require('express').Router();

// get all items, alphabetically sorted
router.route('/all').get((req, res) => {
    Item.find()
        .sort({name: 'asc'})
        .lean()
        .then(allItems => {
            res.set('Cache-Control', 'public, max-age=30');
            res.json(allItems);
        })
        .catch(err => res.status(400).json('Error! ' + err))
});

// get item by id
router.route('/:id').get((req, res) => {
    Item.findById(req.params.id)
    .lean()
    .then(item => res.status(200).json(item))
    .catch(err => res.status(400).json('Error! ' + err))
});

// delete item by id
router.route('/delete/:id').delete((req, res) => {
    Item.deleteOne({ _id: req.params.id })
        .then(success => res.status(204).json('Success! Item deleted.'))
        .catch(err => res.status(400).json('Error! ' + err))
});

// edit item by id (with ownership check)
router.route('/edit/:id').put(async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json('Error! Item not found');
        }
        const username = req.user?.username;
        if (username && item.owner && username !== item.owner) {
            return res.status(403).json('Error! You can only edit your own listings');
        }
        await Item.findByIdAndUpdate(req.params.id, req.body);
        res.json('Success! Item updated.');
    } catch (err) {
        res.status(400).json('Error! ' + err);
    }
});

//create a new item
router.route('/new').post((req, res) => {
    const newItem = new Item(req.body);
    newItem.save().then((data) => res.status(201).json(data)).catch((err) => res.status(400).json(err));
})

module.exports = router;