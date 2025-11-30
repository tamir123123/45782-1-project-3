import { Response } from 'express';
import Joi from 'joi';
import { Vacation } from '../models/Vacation';
import { Follower } from '../models/Follower';
import { AuthRequest } from '../middlewares/auth';
import { Op, fn, col, literal } from 'sequelize';
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { emitVacationUpdate } from '../socket';

const vacationSchema = Joi.object({
  destination: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required().greater(Joi.ref('startDate')),
  price: Joi.number().min(0).max(10000).required()
});

export const getAllVacations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Filters
    const following = req.query.following === 'true';
    const notStarted = req.query.notStarted === 'true';
    const active = req.query.active === 'true';

    const whereClause: any = {};
    const today = new Date().toISOString().split('T')[0];

    if (notStarted) {
      whereClause.startDate = { [Op.gt]: today };
    } else if (active) {
      whereClause.startDate = { [Op.lte]: today };
      whereClause.endDate = { [Op.gte]: today };
    }

    let vacations;
    let total;

    if (following) {
      // Get vacations followed by the user
      const followedVacations = await Vacation.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Follower,
            required: true,
            where: { userId },
            attributes: []
          }
        ],
        attributes: {
          include: [
            [
              literal(`(SELECT COUNT(*) FROM followers WHERE followers.vacation_id = Vacation.vacation_id)`),
              'followersCount'
            ],
            [
              literal(`EXISTS(SELECT 1 FROM followers WHERE followers.vacation_id = Vacation.vacation_id AND followers.user_id = '${userId}')`),
              'isFollowing'
            ]
          ]
        },
        order: [['startDate', 'ASC']],
        limit,
        offset,
        distinct: true
      });

      vacations = followedVacations.rows;
      total = followedVacations.count;
    } else {
      const allVacations = await Vacation.findAndCountAll({
        where: whereClause,
        attributes: {
          include: [
            [
              literal(`(SELECT COUNT(*) FROM followers WHERE followers.vacation_id = Vacation.vacation_id)`),
              'followersCount'
            ],
            [
              literal(`EXISTS(SELECT 1 FROM followers WHERE followers.vacation_id = Vacation.vacation_id AND followers.user_id = '${userId}')`),
              'isFollowing'
            ]
          ]
        },
        order: [['startDate', 'ASC']],
        limit,
        offset
      });

      vacations = allVacations.rows;
      total = allVacations.count;
    }

    res.json({
      vacations,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get vacations error:', error);
    res.status(500).json({ message: 'Server error fetching vacations' });
  }
};

export const getVacationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const vacation = await Vacation.findByPk(id, {
      attributes: {
        include: [
          [
            literal(`(SELECT COUNT(*) FROM followers WHERE followers.vacation_id = Vacation.vacation_id)`),
            'followersCount'
          ],
          [
            literal(`EXISTS(SELECT 1 FROM followers WHERE followers.vacation_id = Vacation.vacation_id AND followers.user_id = '${userId}')`),
            'isFollowing'
          ]
        ]
      }
    });

    if (!vacation) {
      res.status(404).json({ message: 'Vacation not found' });
      return;
    }

    res.json(vacation);
  } catch (error) {
    console.error('Get vacation error:', error);
    res.status(500).json({ message: 'Server error fetching vacation' });
  }
};

export const createVacation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = vacationSchema.validate(req.body);

    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    const { destination, description, startDate, endDate, price } = value;

    // Validate dates are not in the past
    const today = new Date().toISOString().split('T')[0];
    if (startDate < today) {
      res.status(400).json({ message: 'Start date cannot be in the past' });
      return;
    }

    let imageFileName = null;

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image as UploadedFile;

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(imageFile.mimetype)) {
        res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WEBP images are allowed' });
        return;
      }

      // Validate file size (max 20MB for 4K photos)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (imageFile.size > maxSize) {
        res.status(400).json({ message: 'File size too large. Maximum size is 20MB' });
        return;
      }

      const uploadsDir = path.join(__dirname, '../../uploads');

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${imageFile.name}`;
      const uploadPath = path.join(uploadsDir, fileName);

      await imageFile.mv(uploadPath);
      imageFileName = fileName;
    }

    const vacation = await Vacation.create({
      destination,
      description,
      startDate,
      endDate,
      price,
      imageFileName
    });

    res.status(201).json(vacation);
  } catch (error) {
    console.error('Create vacation error:', error);
    res.status(500).json({ message: 'Server error creating vacation' });
  }
};

export const updateVacation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = vacationSchema.validate(req.body);

    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    const vacation = await Vacation.findByPk(id);
    if (!vacation) {
      res.status(404).json({ message: 'Vacation not found' });
      return;
    }

    const { destination, description, startDate, endDate, price } = value;

    let imageFileName = vacation.imageFileName;

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image as UploadedFile;

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(imageFile.mimetype)) {
        res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WEBP images are allowed' });
        return;
      }

      // Validate file size (max 20MB for 4K photos)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (imageFile.size > maxSize) {
        res.status(400).json({ message: 'File size too large. Maximum size is 20MB' });
        return;
      }

      const uploadsDir = path.join(__dirname, '../../uploads');

      // Delete old image if exists
      if (vacation.imageFileName) {
        const oldImagePath = path.join(uploadsDir, vacation.imageFileName);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const fileName = `${Date.now()}-${imageFile.name}`;
      const uploadPath = path.join(uploadsDir, fileName);

      await imageFile.mv(uploadPath);
      imageFileName = fileName;
    }

    await vacation.update({
      destination,
      description,
      startDate,
      endDate,
      price,
      imageFileName
    });

    res.json(vacation);
  } catch (error) {
    console.error('Update vacation error:', error);
    res.status(500).json({ message: 'Server error updating vacation' });
  }
};

export const deleteVacation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vacation = await Vacation.findByPk(id);
    if (!vacation) {
      res.status(404).json({ message: 'Vacation not found' });
      return;
    }

    // Delete image file if exists
    if (vacation.imageFileName) {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const imagePath = path.join(uploadsDir, vacation.imageFileName);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await vacation.destroy();

    res.json({ message: 'Vacation deleted successfully' });
  } catch (error) {
    console.error('Delete vacation error:', error);
    res.status(500).json({ message: 'Server error deleting vacation' });
  }
};

export const followVacation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const vacation = await Vacation.findByPk(id);
    if (!vacation) {
      res.status(404).json({ message: 'Vacation not found' });
      return;
    }

    const existingFollow = await Follower.findOne({
      where: { userId, vacationId: id }
    });

    if (existingFollow) {
      res.status(400).json({ message: 'Already following this vacation' });
      return;
    }

    await Follower.create({ userId, vacationId: id });

    // Emit socket event
    emitVacationUpdate(id, 'follow');

    res.status(201).json({ message: 'Vacation followed successfully' });
  } catch (error) {
    console.error('Follow vacation error:', error);
    res.status(500).json({ message: 'Server error following vacation' });
  }
};

export const unfollowVacation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const follower = await Follower.findOne({
      where: { userId, vacationId: id }
    });

    if (!follower) {
      res.status(404).json({ message: 'Not following this vacation' });
      return;
    }

    await follower.destroy();

    // Emit socket event
    emitVacationUpdate(id, 'unfollow');

    res.json({ message: 'Vacation unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow vacation error:', error);
    res.status(500).json({ message: 'Server error unfollowing vacation' });
  }
};

export const getVacationsReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vacations = await Vacation.findAll({
      attributes: {
        include: [
          [
            literal(`(SELECT COUNT(*) FROM followers WHERE followers.vacation_id = Vacation.vacation_id)`),
            'followersCount'
          ]
        ]
      },
      order: [['destination', 'ASC']]
    });

    const report = vacations.map((v: any) => ({
      destination: v.destination,
      followersCount: v.dataValues.followersCount || 0
    }));

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

export const downloadCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vacations = await Vacation.findAll({
      attributes: {
        include: [
          [
            literal(`(SELECT COUNT(*) FROM followers WHERE followers.vacation_id = Vacation.vacation_id)`),
            'followersCount'
          ]
        ]
      },
      order: [['destination', 'ASC']]
    });

    let csv = 'Destination,Followers\n';
    vacations.forEach((v: any) => {
      csv += `"${v.destination}",${v.dataValues.followersCount || 0}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vacation-followers.csv');
    res.send(csv);
  } catch (error) {
    console.error('Download CSV error:', error);
    res.status(500).json({ message: 'Server error downloading CSV' });
  }
};
