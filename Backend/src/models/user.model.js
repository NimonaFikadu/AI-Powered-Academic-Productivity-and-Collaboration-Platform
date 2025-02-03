const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  subscription_status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'free',
    validate: {
      isIn: [['free', 'premium']]
    }
  },
  subscription_start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

User.associate = (models) => {
  if (models.Transaction) {
    User.hasMany(models.Transaction, {
      foreignKey: 'user_id',
      as: 'transactions'
    });
  }
};

// We'll add these associations back when we create the related models
// User.associate = (models) => {
//   if (models.Topic) {
//     User.hasMany(models.Topic, {
//       foreignKey: 'createdBy',
//       as: 'topics'
//     });
//   }
//   if (models.Quiz) {
//     User.hasMany(models.Quiz, {
//       foreignKey: 'createdBy',
//       as: 'quizzes'
//     });
//   }
//   if (models.QuizAttempt) {
//     User.hasMany(models.QuizAttempt, {
//       foreignKey: 'userId',
//       as: 'quizAttempts'
//     });
//   }
// };

module.exports = User; 