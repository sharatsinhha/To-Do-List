import express from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

const app = express();
const port = 3000;
app.use(express.static("public"));
app.set("view engien", "ejs");
app.use(bodyparser.urlencoded({extended: true}));

mongoose.connect("mongodb+srv://admin-sharat:Test123@cluster0.momdtds.mongodb.net/todolistDB", {useNewUrlParser: true})
    .then(()=> console.log("Database Connected!"))
    .catch((err=> console.log(err)));

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your ToDoList!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaulItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res)=>{
    Item.find()
        .then(function (items) {
            if(items.length === 0){
                Item.insertMany(defaulItems);
                res.redirect("/");
            }else{
                res.render("index.ejs", { listTitle: "Today", newListItems: items});
            }
        })
        .catch(function (err) {
            console.log(err);
        });
});

 app.get("/:customListName", async (req, res)=>{
    try{
        const customListName = _.capitalize(req.params.customListName);
        const foundList = await List.findOne({name: customListName}).exec();
        if(!foundList){
            const list = new List({
                name: customListName,
                items: defaulItems
            });
            list.save();
            res.redirect("/" + customListName);
        }
        else{
            res.render("index.ejs", { listTitle: foundList.name, newListItems: foundList.items}); 
        }
    }catch(err){
        console.log(err);
    }
 });

app.post("/", async (req, res)=>{
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });
    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        try{
            const foundList = await List.findOne({name: listName}).exec();
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }catch(err){
            console.log(err);
        }
    }
});

app.post("/delete", async (req, res) => {
    try {
       const checkedItemId = req.body.checkbox;
       const listName = req.body.listName;
       if(listName === "Today"){
        const deletedItem = await Item.findByIdAndRemove(checkedItemId);
        console.log("Successfully deleted checked item");
        res.redirect("/");
       }
       else{
        const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
        if(foundList){
            res.redirect("/" + listName);
        }
       }
    } catch(err){
       console.log('Error:', err);
    }
 });

app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
});