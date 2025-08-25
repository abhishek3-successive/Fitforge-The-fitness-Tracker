import { Router } from "express";
import { loginUser, registerUser } from "./user.controller";

const router = Router();


// api-end point  

router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;