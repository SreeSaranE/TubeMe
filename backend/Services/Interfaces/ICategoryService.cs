using System.Collections.Generic;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services.Interfaces
{
    public interface ICategoryService
    {
        List<CategoryDetailModel> GetCategories();
        bool AddCategory(string name);
        bool RenameCategory(string oldName, string newName);
        bool DeleteCategory(string name);
    }
}
