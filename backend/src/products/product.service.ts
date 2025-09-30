import { Injectable, NotFoundException, BadRequestException,Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { Product } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductService {
  private readonly logger: Logger = new Logger(ProductService.name);
  constructor(private prisma: PrismaService,
                
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const product = await this.prisma.product.create({
        data: {
          productName: createProductDto.productName,
          currentProductPrice: createProductDto.currentProductPrice,
          lastProductPrice: createProductDto.lastProductPrice,
          imageUrl: createProductDto.imageUrl,
          description: createProductDto.description,
          storeId: createProductDto.storeId,
        },
      });
      return product;
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(productId: number): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    return product;
  }

  async update(productId: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { productId }
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.prisma.product.update({
      where: { productId },
      data: updateProductDto,
    });
  }

  async remove(productId: number): Promise<Product> {
    const existingProduct = await this.findOne(productId);
    
    const deletedProduct = await this.prisma.product.delete({
      where: { productId },
    });

    // Delete associated image file if exists
    if (existingProduct.imageUrl) {
      try {
        const imagePath = path.join(process.cwd(), 'uploads', 'products', path.basename(existingProduct.imageUrl));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.warn(`Failed to delete image file: ${error.message}`);
      }
    }
    return deletedProduct;
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files (JPEG, PNG, GIF) are allowed');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/products/${fileName}`;
  }

  async getProductsWithLatestInventory(): Promise<any[]> {
  try {
    const productsWithInventory = await this.prisma.product.findMany({
      select: {
        productId: true,
        productName: true,
        currentProductPrice: true,
        lastProductPrice: true,
        imageUrl: true,
        description: true,
        storeId: true,
        // ✅ Include latest inventory record
        inventories: {
          orderBy: { date: 'desc' },
          take: 1,
          select: {
            inventoryId: true,
            date: true
          }
        }
      },
      orderBy: {
        productName: 'asc'
      }
    });

    // ✅ Transform the data to flatten inventory info
    return productsWithInventory.map(product => ({
      productId: product.productId,
      productName: product.productName,
      currentProductPrice: product.currentProductPrice,
      lastProductPrice: product.lastProductPrice,
      imageUrl: product.imageUrl,
      description: product.description,
      storeId: product.storeId,
      // ✅ Flatten latest inventory data
      inventory: product.inventories.length > 0 ? {
        inventoryId: product.inventories[0].inventoryId,
        date: product.inventories[0].date
      } : null
    }));
  } catch (error) {
    this.logger.error('Error fetching products with latest inventory:', error);
    throw error;
  }
}

}
