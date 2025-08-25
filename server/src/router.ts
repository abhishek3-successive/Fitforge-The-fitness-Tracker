import {Router} from "express";
import userRouter from "./controller/users/index"
const router = Router();    

router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'User routes are working' });
});

router.use("/users", userRouter);

export default router;
