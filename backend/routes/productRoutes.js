const router = require('express').Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllController);
router.get('/:id', productController.getByIdController);
router.post('/', productController.postController);
router.put('/:id', productController.putController);
router.delete('/:id', productController.deleteController);

module.exports = router;