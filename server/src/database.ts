import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
	try {
		await mongoose.connect(process.env.MONGO_URI as string, {
			retryWrites: false,
			ssl: true
		});
		console.log('Connected to Azure Cosmos DB (MongoDB API)');
	} catch (error) {
		console.error('MongoDB connection failed:', error);
		process.exit(1);
	}
};

export default connectDB;
