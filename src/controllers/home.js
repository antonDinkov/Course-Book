const { Router } = require("express");
const { isUser, isOwner, hasInteracted } = require("../middlewares/guards");
const { body, validationResult } = require("express-validator");
const { parseError } = require("../util");
const { create, getAll, getById, update, deleteById, getLastThree, interact } = require("../services/data");

//TODO replace with real router according to exam description
const homeRouter = Router();

homeRouter.get('/', async (req, res) => {
    //This code creates a token and saves it in a cookie
    //const result = await login('John', '123456');
    //const token = createToken(result);
    //res.cookie('token', token)

    const lastThree = await getLastThree();


    res.render('home', { title: 'Home', posts: lastThree });
});

homeRouter.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
});

homeRouter.get('/create', isUser(), (req, res) => {
    res.render('create', { title: 'Create' });
});
homeRouter.post('/create', isUser(),
    body('title').trim().isLength({ min: 2 }).withMessage('The Title should be atleast 2 characters'),
    body('description').trim().isLength({ min: 10, max: 100 }).withMessage('The Description should be between 10 and 100 characters long'),
    body('ingredients').trim().isLength({ min: 10, max: 200 }).withMessage('The Ingredients should be between 10 and 200 characters long'),
    body('instructions').trim().isLength({ min: 10 }).withMessage('The Instructions should be atleast 10 characters'),
    body('image').trim().isURL({ require_tld: false, require_protocol: true }).withMessage('The Image should start with http:// or https:// and must be a valid URL'),
    async (req, res) => {
        const { title, description, ingredients, instructions, image } = req.body;
        try {
            const validation = validationResult(req);
            
            if (!validation.isEmpty()) {
                throw validation.array();
            }

            const authorId = req.user._id;

            const result = await create(req.body, authorId);

            res.redirect('/catalog');
        } catch (err) {
            res.render('create', { data: { title, description, ingredients, instructions, image }, errors: parseError(err).errors })
        }
    });

homeRouter.get('/catalog', async (req, res) => {
    const posts = await getAll();
    res.render('catalog', { posts, title: 'Catalog' });
});

homeRouter.get('/catalog/:id', async (req, res) => {

    const id = req.params.id;
    const post = await getById(id);
    
    const interactorsNames = post.signUpList.join(', ');
    let interactionCount = post.signUpList.length;

    if (!post) {
        res.render('404', { title: 'Error' });
        return;
    };

    const isLoggedIn = req.user;
    
    const isAuthor = req.user?._id == post.owner.toString();
    
    const hasInteracted = Boolean(post.recommendList.find(id => id.toString() == req.user?._id.toString()));

    res.render('details', { post, interactionCount, isLoggedIn, isAuthor, hasInteracted, interactorsNames, title: `Details ${post.name}` });
});


homeRouter.get('/catalog/:id/edit', isOwner(), async (req, res) => {
    
    try {
        const post = await getById(req.params.id);

        if (!post) {
            console.log('Blocked');
            
            res.render('404');
            return;
        };

        res.render('edit', { post, title: `Edit ${post.brand}` });
    } catch (err) {
        console.error('Error loading edit form: ', err);
        res.redirect('/404');
    }
});
homeRouter.post('/catalog/:id/edit', isOwner(),
    body('title').trim().isLength({ min: 2 }).withMessage('The Title should be atleast 2 characters'),
    body('description').trim().isLength({ min: 10, max: 100 }).withMessage('The Description should be between 10 and 100 characters long'),
    body('ingredients').trim().isLength({ min: 10, max: 200 }).withMessage('The Ingredients should be between 10 and 200 characters long'),
    body('instructions').trim().isLength({ min: 10 }).withMessage('The Instructions should be atleast 10 characters'),
    body('image').trim().isURL({ require_tld: false, require_protocol: true }).withMessage('The Image should start with http:// or https:// and must be a valid URL'),
    async (req, res) => {
        const post = await getById(req.params.id);
        try {
            const validation = validationResult(req);

            if (!validation.isEmpty()) {
                throw validation.array();
            }

            if (!post) {
                res.render('404');
                return;
            };
            
            const newRecord = await update(req.params.id, req.user._id, req.body);
            
            res.redirect(`/catalog/${req.params.id}`);
        } catch (err) {
            console.log(err);
            
            res.render('edit', { post, errors: parseError(err).errors });
        }
    });

homeRouter.get('/catalog/:id/delete', isOwner(), async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user._id;
        await deleteById(id, userId);
        res.redirect('/catalog');
    } catch (err) {
        res.render('404', { title: 'Error' });
    }
});

homeRouter.get('/catalog/:id/interact', hasInteracted(), async (req, res) => {
    try {
        await interact(req.params.id, req.user._id, "recommendList");
        res.redirect(`/catalog/${req.params.id}`);
    } catch (err) {
        res.render('404', { title: 'Error' });
    }
});

homeRouter.get('/profile', isUser(), async (req, res) => {
    const { _id, username, email} = req.user;
    const posts = await getAll();
    const ownerTo = posts.filter(p => p.owner.toString() == _id.toString());
    console.log('User is owner to: ', ownerTo);
    const ownerToResult = ownerTo.length > 0 ? ownerTo : null;
    const ownerToCount = ownerTo.length;
    
    const interactedWith = posts.filter((p) => {
        const array = p.recommendList.map(p => p.toString());
        return array.includes(_id.toString())
    });
    console.log('User has interacted with: ', interactedWith);
    const interactedWithResult = interactedWith.length > 0 ? interactedWith : null;
    const inteactedWithCount = interactedWith.lengthl

    res.render('profile', { title: 'Profile', _id, username, email, ownerToResult, ownerToCount, interactedWithResult, inteactedWithCount });
});

homeRouter.get('/search', async (req, res) => {
    const { searchValue1 = ''/* , searchValue2 = '' name в темплейта трябва да съвпада */ } = req.query;
    let posts = await getAll();

    if (searchValue1) {// сменям ключовете на обекта спрямо модела
        posts = posts.filter(p => p.title.toLowerCase().includes(searchValue1.toLowerCase()));
    };

   /*  if (searchValue2) {
        posts = posts.filter(p => p.system.toLowerCase().includes(searchSystem.toLowerCase()));
    }; */

    res.render('search', { posts, searchValue1,/*  searchValue2, */ title: 'Search' });
});

module.exports = { homeRouter }