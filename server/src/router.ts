import {Router} from "express";
import {
    challengesrouter,
    Exerciserouter,
    Progressphotorouter,
    userRouter,
    WorkoutSessionrouter,
    workoutPlanrouter
} from "./controller";

const router = Router();    

router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API routes are working' });
});

router.use("/users", userRouter);
router.use("/challenges", challengesrouter);
router.use("/exercises", Exerciserouter);
router.use("/progress-photos", Progressphotorouter);
router.use("/workout-sessions", WorkoutSessionrouter);
router.use("/workout-plans", workoutPlanrouter);

export default router;
