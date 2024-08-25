// Ici on fait l'importation des modules necessaires pour l'application Express
const express = require("express"); // Framework pour faire des applications web
const path = require("path"); // Module pour manipuler les chemins de fichiers
const bodyparser = require("body-parser"); // Middleware pour parser les corps de requetes
const session = require("express-session"); // Middleware pour gerer les sessions utilisateur
const { v4: uuidv4 } = require("uuid"); // Fonction pour generer des identifiants uniques
const mongoose = require("mongoose"); // Bibliotheque pour modeliser les donnees avec MongoDB
const multer = require("multer"); // Middleware pour gérer les fichiers televerse

// Connexion à la base de donnees MongoDB
mongoose
  .connect("mongodb://localhost:27017/NodePrj") // URL de connexion à la base de donnees MongoDB ma db se nomme NodePrj
  .then(() => console.log("MongoDB connected")) // Message si connection reussie
  .catch((err) => console.log(err)); // en cas d'echec

// Configuration du stockage pour les fichiers televerse avec multer
const storage = multer.diskStorage({
  // Definir le repertoire de destination des fichiers televerse
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Les fichiers seront stockés dans le repertoire "uploads/"
  },
    // Definir le nom du fichier televerse
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
     // Nom du fichier sera constitue de la date actuelle (en millisecondes) 
    // suivie de l'extension originale du fichier
  },
});
// Creation de l'instance multer avec la configuration de stockage definie
const upload = multer({ storage: storage });

// Definition du schema Mongoose pour un modele de donnees
const Schema = new mongoose.Schema({
  name: {
    type: String,  // Le champ "name" est de type chaine de caracteres
    required: true, // Ce champ est obligatoire
  },
  password: {
    type: String, // Le champ "password" est de type chaine de caracteres
    required: true, // Ce champ est obligatoire
  },
  role: {
    type: String, // Le champ "role" est de type chaine de caracteres
    default: "user", // Valeur par defaut du champ "role" est "user"
  },
});

// Definition du schema Mongoose pour le modèle de produit
const productSchema = new mongoose.Schema({
  name: {
    type: String, // Le champ "name" est de type chaîne de caracteres
    required: true, // Ce champ est obligatoire

  },
  price: {
    type: Number, // Le champ "price" est de type nombre
    required: true, // Ce champ est obligatoire
  },
  description: {
    type: String, // Le champ "description" est de type chaine de caracteres
    required: true,  // Ce champ est obligatoire
  },
  image: {
    type: String, // Le champ "image" est de type chaine de caracteres
    required: true, // Ce champ est obligatoire
  },
});

// Definition du schema Mongoose pour le modele de panier
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Champ pour l'identifiant de l'utilisateur, de type ObjectId
    required: true, // Ce champ est obligatoire
    ref: "Collection1", // Reference à la collection "Collection1" (modele utilisateur)
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId, // Champ pour l'identifiant du produit, de type ObjectId
        required: true, // Ce champ est obligatoire
        ref: "Product", // Reference au modèle "Product"
      },
      quantity: {
        type: Number, // Champ pour la quantite, de type nombre
        default: 1, // Valeur par defaut de la quantite est 1
      },
    },
  ],
});

// Creation des modeles Mongoose bases sur les schemas definis

// Creation du modele "Product" en utilisant le schema "productSchema"
const Product = mongoose.model("Product", productSchema);

// Creation du modele "Cart" en utilisant le schéma "cartSchema"
const Cart = mongoose.model("Cart", cartSchema);

// Creation du modele "Collection1" en utilisant le schema "Schema" c'est les utilisateurs.
const collection = mongoose.model("Collection1", Schema);

// Creation de l'application Express
const app = express();
// Definition du port sur lequel le serveur ecoute les requetes (port 3000)
const port = 3000;



// Configuration du middleware de gestion des sessions avec express-session
app.use(
  session({
    secret: uuidv4(), // Cle secrete pour signer les cookies de session, utilise un identifiant unique
    resave: false, // Ne pas enregistrer la session a chaque requete
    saveUninitialized: true, // Enregistrer les sessions non initialisees
  })
);
// Definition du moteur de rendu des vues comme EJS
app.set("view engine", "ejs");

// Middleware pour parser les corps de requetes encodes en URL (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));

// Middleware pour servir les fichiers statiques du repertoire "uploads" sous le chemin "/uploads"
app.use("/uploads", express.static("uploads"));

// Routes pour l'application Express


app.get("/", (req, res) => {
  res.render("base.ejs");
  // Route pour la page d'accueil, rend la vue "base.ejs" le login
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
    // Route pour la page d'inscription, rend la vue "signup.ejs"
});
app.get("/login", (req, res) => {
  res.render("base.ejs");
   // Route pour la page de connexion, rend la vue "base.ejs"
});


// Route POST pour l'inscription des utilisateurs
app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.name, // Nom de l'utilisateur pris depuis le corps de la requete
    password: req.body.password,  // Mot de passe de l'utilisateur pris depuis le corps de la requete
    role: "user", // l'utilisateur va etre enregistre comme user par defaut et si on veut le rendre admin ca sera dans le cote admin
  };
   // Creation d'un nouvel utilisateur avec les donnees fournies
  await collection.create(data);
    // Redirection vers la page d'accueil apres l'inscription pour que le user peut se log in
  res.redirect("/");
});

// Route POST pour la connexion des utilisateurs
app.post("/login", async (req, res) => {
  try {
       // Recherche d'un utilisateur avec le nom fourni dans le corps de la requete
    const check = await collection.findOne({ name: req.body.name });
    // Si l'utilisateur n'est pas trouve, envoi d'un message d'erreur
    if (!check) {
      
      return res.send("User not found");
    }
    if (check.password === req.body.password) {
      // Si le mot de passe est correct, sauvegarde de l'utilisateur dans la session
      req.session.user = check; 
      // Redirection vers la page d'accueil utilisateur
      if (check.role === "user") {
        return res.redirect("/home"); 
      }
       // Redirection vers la page d'administration
      else if (check.role === "admin") {
        return res.redirect("/admin"); 
      }
       // Si le role est inconnu, envoi d'un message d'erreur
      else {
        return res.send("Unknown role");
      }
    }
     // Si le mot de passe est incorrect, envoi d'un message d'erreur
    else {
      return res.send("Wrong password");
    }
  } catch (error) {
     // Affichage de l'erreur dans la console
    console.error(error);
    res.send("An error occurred");
  }
});

// Route GET pour la page d'administration
app.get("/admin", async (req, res) => {
  // Verifie si l'utilisateur est connecte et a le role d'administrateur
  if (req.session.user && req.session.user.role === "admin") {
    try {
       // Recuperation de tous les utilisateurs depuis la collection
      const users = await collection.find();
      // Recuperation de tous les produits depuis le modele Product
      const products = await Product.find();
      // Rendu de la vue "admin" avec les donnees des utilisateurs et des produits
      res.render("admin", { users, products }); 
    } catch (error) {
      // Affichage de l'erreur dans la console
      console.error(error);
       // Envoi d'un message d'erreur en cas de probleme lors de la recuperation des donnees
      res.send("An error occurred while retrieving data.");
    }
  } else {
        // Redirection vers la page d'accueil si l'utilisateur n'est pas administrateur
    res.redirect("/"); 
  }
});


// Route GET pour la page de modification d'utilisateur
app.get("/edit-user/:id", async (req, res) => {
  try {
    // Recherche d'un utilisateur par son identifiant fourni dans l'URL
    const user = await collection.findById(req.params.id);
    if (!user) {
    // Si l'utilisateur n'est pas trouve, envoi d'un message d'erreur 404
      return res.status(404).send("User not found");
    }
    // Rendu de la vue "edit-user" avec les donnees de l'utilisateur
    res.render("edit-user", { user });
  } catch (err) {
    // Envoi d'un message d'erreur 500 en cas d'exception, avec le message d'erreur
    res.status(500).send(err.message + "ll");
  }
});

// Route POST pour la mise a jour d'un utilisateur
app.post("/edit-user/:id", async (req, res) => {
  try {
    // Recuperation de l'identifiant de l'utilisateur depuis l'URL
    const userId = req.params.id;

      // Extraction des donnees du corps de la requete
    const { name, password, role } = req.body;

      // Affichage dans la console des details de la mise a jour
    console.log(
      `Updating user with ID: ${userId}, Name: ${name}, Role: ${role}`
    );


     // Mise a jour de l'utilisateur avec les nouvelles donnees et recuperation de l'utilisateur mis a jour
    const updatedUser = await collection.findByIdAndUpdate(
      userId,
      { name, password, role },
      { new: true }
    );

     // Si l'utilisateur n'est pas trouve, envoi d'un message d'erreur 404
    if (!updatedUser) {
       // Redirection vers la page d'administration apres la mise a jour
      return res.status(404).send("User not found");
    }
    res.redirect("/admin");
  } catch (err) {
       // Affichage de l'erreur dans la console
    console.error("Error updating user:", err);
      // Envoi d'un message d'erreur 500 en cas d'exception
    res.status(500).send(err.message);
  }
});


// Route POST pour la suppression d'un utilisateur
app.post('/delete-user/:id', async (req, res) => {
  try {

    // Recuperation de l'identifiant de l'utilisateur depuis l'URL
    const userId = req.params.id;
    
    // Suppression de l'utilisateur avec l'identifiant donne
    await collection.findByIdAndDelete(userId);
     // Redirection vers la page d'administration apres la suppression
      res.redirect('/admin'); 
  } catch (error) {
    // Affichage de l'erreur dans la console
    console.error(error);
    // Envoi d'un message d'erreur 500 en cas d'exception lors de la suppression
      res.status(500).send('An error occurred while deleting the user.');
  }
});

// Route GET pour la page d'accueil utilisateur
app.get("/home", async (req, res) => {
  try {
    // Recuperation de tous les produits depuis le modele Product
    const products = await Product.find();

    // Recherche du panier de l'utilisateur actuel en utilisant l'identifiant de l'utilisateur dans la session
    const cart = await Cart.findOne({ userId: req.session.user._id });

    // Calcul du nombre d'articles dans le panier et 0 si le panier n'existe pas encore
    const cartCount = cart ? cart.items.length : 0;


     // Rendu de la vue "home" avec les produits et le nombre d'articles dans le panier
    res.render("home", { products, cartCount });
  } catch (error) {
     // Affichage de l'erreur dans la console
    console.error(error);
      // Envoi d'un message d'erreur en cas de probleme lors de la recuperation des produits
    res.send("An error occurred while retrieving products.");
  }
});

// Route POST pour l'ajout d'un produit
app.post("/add-product", upload.single("image"), async (req, res) => {
  try {
    const newProduct = {
        // Nom du produit pris depuis le corps de la requete
      name: req.body.name,
      // Prix du produit pris depuis le corps de la requete
      price: req.body.price,
      // Description du produit prise depuis le corps de la requete
      description: req.body.description,
       // Chemin de l'image du produit si un fichier a ete upload, sinon null
      image: req.file ? req.file.path : null,
    };
     // Creation du nouveau produit avec les donnees fournies
    await Product.create(newProduct);

    // Redirection vers la page d'administration apres l'ajout du produit
    res.redirect("/admin");
  } catch (error) {
        // Affichage de l'erreur dans la console
    console.error(error);
      // Envoi d'un message d'erreur en cas de probleme lors de l'ajout du produit
    res.send("An error occurred while adding the product.");
  }
});

// Route GET pour la page d'edit de produit
app.get("/edit-product/:id", async (req, res) => {
  try {
    // Recherche du produit par son identifiant fourni dans l'URL
    const product = await Product.findById(req.params.id);
    if (product) {
         // Rendu de la vue "edit-product" avec les donnees du produit
      res.render("edit-product", { product });
    } else {
         // Envoi d'un message si le produit n'est pas trouve
      res.send("Product not found");
    }
  } catch (error) {
      // Affichage de l'erreur dans la console
    console.error(error);
        // Envoi d'un message d'erreur en cas de probleme lors de la recuperation du produit
    res.send("An error occurred while retrieving the product.");
  }
});

// Route pour traiter la mise a jour d'un produit
app.post("/update-product/:id", upload.single("image"), async (req, res) => {
  try {
    const updatedProduct = {
        // Nom du produit pris depuis le corps de la requete
      name: req.body.name,
      // Prix du produit pris depuis le corps de la requete
      price: req.body.price,
       // Description du produit prise depuis le corps de la requete
      description: req.body.description,
            // Chemin de la nouvelle image si un fichier a ete upload, sinon utilisation de l'image existante
      image: req.file ? req.file.path : req.body.existingImage,
    };
        // Mise a jour du produit avec les nouvelles donnees
    await Product.findByIdAndUpdate(req.params.id, updatedProduct);
    res.redirect("/admin");
        // Redirection vers la page d'administration apres la mise a jour du produit
  } catch (error) {
    // Affichage de l'erreur dans la console
    console.error(error);
        // Envoi d'un message d'erreur en cas de probleme lors de la mise a jour du produit
    res.send("An error occurred while updating the product.");
  }
});

// Route pour traiter la suppression d'un produit
app.post("/delete-product/:id", async (req, res) => {
  try {
    // Suppression du produit avec l'identifiant fourni dans l'URL
    await Product.findByIdAndDelete(req.params.id);
    // Redirection vers la page d'administration apres la suppression du produit
    res.redirect("/admin");
  } catch (error) {
      // Affichage de l'erreur dans la console
    console.error(error);
        // Envoi d'un message d'erreur en cas de probleme lors de la suppression du produit
    res.send("An error occurred while deleting the product.");
  }
});

// Route pour ajouter un produit au panier
app.post("/add-to-cart/:productId", async (req, res) => {
  try {
      // Recuperation de l'identifiant de l'utilisateur depuis la session
    const userId = req.session.user._id;
      // Recuperation de l'identifiant du produit depuis l'URL
    const productId = req.params.productId;

     // Recherche du panier de l'utilisateur
    let cart = await Cart.findOne({ userId });

    if (!cart) {
        // Creation d'un nouveau panier si aucun n'existe pour l'utilisateur
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
          // Recherche de l'index de l'article dans le panier si le produit est deja present
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Augmentation de la quantite de l'article si le produit est deja dans le panier
      cart.items[existingItemIndex].quantity += 1;
    } else {
      // Ajout du produit au panier s'il n'est pas encore present
      cart.items.push({ productId });
    }
   // Sauvegarde des modifications du panier
    await cart.save();
      // Redirection vers la page d'achat apres l'ajout du produit au panier
    res.redirect("/home");
  } catch (error) {
     // Affichage de l'erreur dans la console
    console.error(error);
       // Envoi d'un message d'erreur en cas de probleme lors de l'ajout du produit au panier
    res.send("An error occurred while adding the product to the cart.");
  }
});

// Route pour retirer un produit du panier
app.post("/remove-from-cart/:productId", async (req, res) => {
  try {
    // Assure que l'utilisateur est connecte et obtient son identifiant
    const userId = req.session.user._id;

     // Recuperation de l'identifiant du produit depuis l'URL
    const productId = req.params.productId;

    // Recherche du panier de l'utilisateur
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Filtrage des articles pour retirer celui dont l'identifiant correspond
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId
      );
         // Sauvegarde des modifications du panier
      await cart.save();
    }

    // Redirection vers la page du panier apres la suppression du produit
    res.redirect("/cart");
  } catch (error) {
    console.error(error);
    res.send("An error occurred while removing the product from the cart.");
  }
});


// Route pour afficher le panier
app.get('/cart', async (req, res) => {
  try {
    // Recherche du panier de l'utilisateur et peuplement des informations sur les produits dans les articles du panier
      const cart = await Cart.findOne({ userId: req.session.user._id }).populate('items.productId');

       // Calcul du prix total pour chaque article et du prix total global
      let overallTotalPrice = 0;
    if (cart) {
         // Calcul du prix total pour chaque article et ajout au prix total global
          cart.items.forEach(item => {
              item.totalPrice = item.productId.price * item.quantity;
              overallTotalPrice += item.totalPrice;
          });
      }
      // Rendu de la vue "cart" avec les donnees du panier et le prix total global
      res.render('cart', { cart, overallTotalPrice });
  } catch (error) {
     // Affichage de l'erreur dans la console
    console.error(error);
        // Envoi d'un message d'erreur en cas de probleme lors de la recuperation du panier
      res.status(500).send('An error occurred while retrieving the cart.');
  }
});



// Route pour deconnecter l'utilisateur
app.get('/logout', (req, res) => {
 
  req.session.destroy(err => {
    if (err) {
              // Redirection vers la page de log in en cas d'erreur lors de la destruction de la session
          return res.redirect('/'); 
      }
      
// Redirection vers la page de log in apres la deconnexion
      res.redirect('/login');
  });
});

// Route pour incrementer la quantite d'un produit dans le panier
app.post('/increment-quantity/:id', async (req, res) => {
  const productId = req.params.id;
try{
  // Trouver le panier de l'utilisateur
  const cart = await Cart.findOne({ userId: req.session.user._id });

  if (cart) {
        // Trouver l'article dans le panier
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

      if (itemIndex !== -1) {
          const item = cart.items[itemIndex];

          // Incrementation de la quantite de l'article
              item.quantity += 1;
         
 // Sauvegarde des modifications du panier
          await cart.save();
      }
  }
  // Redirection vers la page du panier apres l'incrementation de la quantite
  res.redirect('/cart');
} catch (error) {
  // Affichage de l'erreur dans la console
  console.error('Error decrementing quantity:', error);
  res.status(500).send('An error occurred while updating the cart.');
}
});



// Route pour decrementer la quantite d'un produit dans le panier
app.post('/decrement-quantity/:id', async (req, res) => {
  const productId = req.params.id;

  try {
        // Trouver le panier de l'utilisateur
      const cart = await Cart.findOne({ userId: req.session.user._id });

      if (cart) {
          // Trouver l'article dans le cart
          const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

          if (itemIndex !== -1) {
              const item = cart.items[itemIndex];

              if (item.quantity > 1) {
                   // Decrementer la quantite
                  item.quantity -= 1;
              } else {
                  // Supprimer l'article si la quantite est 1
                  cart.items.splice(itemIndex, 1);
              }
   // Sauvegarder les modifications du panier
              await cart.save();
          }
      }

    // Redirection vers la page du panier apres la decrementation de la quantite
      res.redirect('/cart');
  } catch (error) {
    console.error('Error decrementing quantity:', error);
    // Envoi d'un message d'erreur en cas de probleme lors de la mise a jour du panier
      res.status(500).send('An error occurred while updating the cart.');
  }
});



// Lancer le serveur et ecouter sur le port specifie
app.listen(port, () => {
   // Affichage du message dans la console pour indiquer que le serveur est en marche
  console.log(`Listening to the server on http://localhost:${port}`);
});


// Exporter les modeles pour les rendre disponibles dans d'autres fichiers
module.exports = { collection, Product, Cart };
